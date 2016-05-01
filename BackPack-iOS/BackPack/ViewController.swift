//
//  ViewController.swift
//  BackPack
//
//  Created by Sagar Punhani on 4/12/16.
//  Copyright © 2016 Sagar Punhani. All rights reserved.
//

import UIKit
import CoreLocation
import AVFoundation
import Firebase


class ViewController: UIViewController,UIImagePickerControllerDelegate,UINavigationControllerDelegate,SpeechRecognitionProtocol, CLLocationManagerDelegate {
    
    //uielements
    @IBOutlet weak var photoImage: UIImageView!
    @IBOutlet weak var latLabel: UILabel!
    @IBOutlet weak var longLabel: UILabel!
    @IBOutlet weak var speechToTextLabel: UILabel!
    @IBOutlet weak var speakLabel: UITextView!
    @IBOutlet weak var photoContainer: UIView!
    @IBOutlet weak var locationContainer: UIView!
    
    @IBOutlet weak var microphoneContainer: UIView!
    
    @IBOutlet weak var speechContainer: UIView!
    
    //imgur stuff
    let client = ImgurAnonymousAPIClient(clientID: "88e9e52b36ac947")
    
    //camera stuff
    var camera: UIImagePickerController?
    var tookPicture = false
    var quality:CGFloat = 1.0
    
    //speech stuff
    var subscriptionKey = "ff19141d0b884a68bf1ffdbf3d9044a0"
    var secondKey = "2d75f8f531fa4bd3a46c648fd10a8346"
    let language = "en-us"
    var micClient: MicrophoneRecognitionClient?
    var canSpeak = true
    
    //location
    let locationManager = CLLocationManager()
    
    //text-speech
    let synth = AVSpeechSynthesizer()
    var myUtterance = AVSpeechUtterance(string: "")
    
    //firebase
    var ref = Firebase(url: "https://project-backpack.firebaseio.com")
    
    //voice commands
    var commands = ["Hi","I'm analyzing your surroundings","Here's what I see","Thanks for submitting!","Navigating you to your new location"]
    
    
    @IBOutlet weak var label: UILabel!

    override func viewDidLoad() {
        super.viewDidLoad()
        
        //microphone
        startMicrophone()
        
        //setup camera
        camera = UIImagePickerController()
        camera!.delegate = self
        camera?.sourceType = .Camera
        camera?.showsCameraControls = false
        
        //location stuff
        // Ask for Authorisation from the User.
        self.locationManager.requestAlwaysAuthorization()
        
        // For use in foreground
        self.locationManager.requestWhenInUseAuthorization()
        
        if CLLocationManager.locationServicesEnabled() {
            locationManager.delegate = self
            locationManager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters
        }
        
        //firebase
        ref.observeEventType(.ChildChanged, withBlock: { snapshot in
            if snapshot.key == "getPicture" {
                if snapshot.value as! Int == 1 {
                    self.beginPhoto()
                }
            }
            if snapshot.key == "comfortChild" {
                if snapshot.value as! Int == 1 {
                    self.textToSpeech("Don't worry kiddo we are looking for your parents")
                    self.ref.childByAppendingPath("comfortChild").setValue(0)
                }
            }
            if snapshot.key == "commandChild" {
                if snapshot.value as! Int == 1 {
                    self.textToSpeech("Please stay still. Your parents are coming to get you")
                    self.ref.childByAppendingPath("commandChild").setValue(0)
                }
            }
            if snapshot.key == "speaker" {
                if let val = snapshot.value as? Int{
                    if val >= 0 {
                        self.textToSpeech(self.commands[val])
                    }
                }
            }
        })
        
        //UI Stuff
        setBorder(photoContainer)
        setBorder(locationContainer)
        setBorder(microphoneContainer)
        setBorder(speechContainer)

        // Do any additional setup after loading the view, typically from a nib.
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    //Set Border for each continer
    func setBorder(view: UIView) {
        view.layer.borderWidth = 1
    }
    
    
    //brings up view controller
    func beginPhoto() {
        self.presentViewController(camera!, animated: false) {
            NSTimer.scheduledTimerWithTimeInterval(1.0, target: self, selector: #selector(ViewController.takePhoto), userInfo: nil, repeats: false)
        }
        
    }
    
    //programtically takes picture
    func takePhoto() {
        camera?.takePicture()
    }

    //gets picture after taking it
    func imagePickerController(picker: UIImagePickerController, didFinishPickingImage image: UIImage, editingInfo: [String : AnyObject]?) {
        photoImage.image = image
        uploadPhoto(image)
        picker.dismissViewControllerAnimated(false, completion: nil)
    }
    
    //upload image to imgur
    func uploadPhoto(image: UIImage) {
        
        //crop image
        let newimage = ImageUtil.RBSquareImageTo(image, size: CGSize(width: 2000, height: 200))
        
        self.client.uploadImage(newimage, withFilename: "cool", completionHandler: { (url, error) in
            self.ref.childByAppendingPath("getPicture").setValue(0)
            self.ref.childByAppendingPath("link").setValue(url.absoluteString)
        })

    }
    
    //initailizes speech recongition client
    func startMicrophone() {
        canSpeak = true
        if micClient == nil {
            micClient = SpeechRecognitionServiceFactory.createMicrophoneClient(.LongDictation, withLanguage: self.language, withPrimaryKey: self.subscriptionKey, withSecondaryKey: self.secondKey, withProtocol: self)
        }
        
        //start speaking
        micClient?.startMicAndRecognition()
        
    }
    
    //end microphone
    func endMicrophone() {
        canSpeak = false
        micClient?.endMicAndRecognition()
    }
    
    //partial results
    func onPartialResponseReceived(partialResult: String!) {
        self.speechToTextLabel.text = partialResult
    }
    
    //function is called when u stop speaking
    func onFinalResponseReceived(result: RecognitionResult!) {
        //go through all potential phrases
        for i in 0 ..< result.RecognizedPhrase.count {
            let phrase = result.RecognizedPhrase[i]
            print("\(phrase.DisplayText) \(phrase.Confidence.rawValue)")
            let string = phrase.DisplayText!.stringByReplacingOccurrencesOfString(" ", withString: "%20")
            
            getIntent(String(string.characters.dropLast()))
            dispatch_async(dispatch_get_main_queue(), {
                self.speechToTextLabel.text = "\(phrase.DisplayText)"
            })
        }
        //continue to listen
        if canSpeak {
            micClient?.startMicAndRecognition()
        }
        
    }
    
    //called speech-to-text if there is an error
    func onError(errorMessage: String!, withErrorCode errorCode: Int32) {
        print(errorMessage)
    }
    
    //if microphone status changes
    func onMicrophoneStatus(recording: Bool) {
        if recording {
            print("begin recording")
        } else {
            print("recoring ended")
        }
    }
    
    //function is called if location changes
    func locationManager(manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        let locValue = manager.location!.coordinate
        latLabel.text = "lat: \(locValue.latitude)"
        longLabel.text = "long: \(locValue.longitude)"
    }
    
    //text to speech ios sdk
    func textToSpeech(text: String) {
        myUtterance = AVSpeechUtterance(string: text)
        myUtterance.rate = 0.4
        myUtterance.voice = AVSpeechSynthesisVoice(language: "en-AU")
        endMicrophone()
        synth.speakUtterance(myUtterance)
        NSTimer.scheduledTimerWithTimeInterval(2.0, target: self, selector: #selector(ViewController.startMicrophone), userInfo: nil, repeats: false)
    }
    
    //button actions
    @IBAction func actionButton(sender: UIButton) {
        switch sender.titleLabel!.text! {
        case "Take Photo" :
            beginPhoto()
        case "Start Location":
            locationManager.startUpdatingLocation()
        case "Stop Location":
            locationManager.stopUpdatingLocation()
        case "Start Microphone":
            startMicrophone()
        case "Stop Microphone":
            endMicrophone()
        case "Speak":
            textToSpeech(speakLabel.text)
        default: print("wrong button")
        }
    }
    
    //handle keyboard
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        let touch = event?.allTouches()?.first
        
        if self.speakLabel.isFirstResponder() && touch!.view != self.speakLabel {
            self.speakLabel.resignFirstResponder()
        }
    }
    
    //get request
    
    func getIntent(string: String) {
        print("*******************************\(string)")
        // Setup the session to make REST GET call.  Notice the URL is https NOT http!!
        let postEndpoint: String = "https://api.projectoxford.ai/luis/v1/application?id=8a5d0cec-688c-4255-bc81-115ce7afca9b&subscription-key=f6f9069274c843aba8f5368bab5a74a5&q=\(string)"
        let session = NSURLSession.sharedSession()
        let url = NSURL(string: postEndpoint)!
        
        // Make the POST call and handle it in a completion handler
        session.dataTaskWithURL(url, completionHandler: { ( data: NSData?, response: NSURLResponse?, error: NSError?) -> Void in
            
            
            // Read the JSON
            do {
                if let _ = NSString(data:data!, encoding: NSUTF8StringEncoding) {
                    // Print what we got from the call
                    //print(ipString)
                    
                    // Parse the JSON to get the IP
                    let jsonDictionary = try NSJSONSerialization.JSONObjectWithData(data!, options: NSJSONReadingOptions.MutableContainers) as! NSDictionary
                    if let intents = jsonDictionary["intents"] as? [[String: AnyObject]] {
                        if let _ = intents[0]["intent"] as? String{
                            self.ref.childByAppendingPath("Intent").setValue(intents[0]["intent"])
                        }
                        
                    }
                    
                }
            } catch {
                print("bad things happened")
            }
        }).resume()
    }

    
    

    
    
    


}

