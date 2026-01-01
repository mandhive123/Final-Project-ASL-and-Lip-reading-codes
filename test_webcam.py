"""
Simple Webcam Test - See what your model predicts in real-time

INSTRUCTIONS:
1. Save this as: test_webcam.py
2. Run: python test_webcam.py
3. Show ASL signs to camera
4. Watch what it predicts
5. Press 'q' to quit
"""

from ultralytics import YOLO
import cv2
import time

def test_model_webcam():
    """Test your YOLO model with webcam"""
    
    print("="*60)
    print("🎥 WEBCAM MODEL TEST")
    print("="*60)
    
    # CHANGE THIS PATH to where your model is
    model_path = r"C:\Users\ASUS\Desktop\Sign_In_Project\dataset\trained_model\best.pt"
    
    # Load model
    print(f"\n📦 Loading model from: {model_path}")
    try:
        model = YOLO(model_path)
        print("✅ Model loaded successfully!")
    except Exception as e:
        print(f"❌ ERROR: Could not load model!")
        print(f"Error: {e}")
        print("\nMake sure the path is correct!")
        return
    
    # Show model info
    print(f"\n📋 Model knows these letters:")
    print(f"   {list(model.names.values())}")
    print(f"   Total: {len(model.names)} letters")
    
    # Open webcam
    print("\n🎥 Opening webcam...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ ERROR: Could not open webcam!")
        return
    
    print("✅ Webcam opened!")
    print("\n" + "="*60)
    print("INSTRUCTIONS:")
    print("  - Show ASL hand signs to the camera")
    print("  - Watch what letter appears on screen")
    print("  - Press 'q' to quit")
    print("="*60 + "\n")
    
    # Wait a moment
    time.sleep(2)
    
    while True:
        # Read frame from webcam
        ret, frame = cap.read()
        
        if not ret:
            print("❌ Cannot read from webcam")
            break
        
        # Run YOLO prediction
        results = model(frame, conf=0.5, verbose=False)[0]
        
        # Draw results on frame
        if len(results.boxes) > 0:
            # Get best detection
            box = results.boxes[0]
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            predicted_letter = model.names[class_id]
            
            # Get bounding box coordinates
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
            
            # Draw rectangle around hand
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)
            
            # Show prediction text - BIG and CLEAR
            text = f"{predicted_letter} ({confidence:.0%})"
            
            # Big text at top
            cv2.putText(frame, text, (50, 80), 
                       cv2.FONT_HERSHEY_SIMPLEX, 2.5, (0, 255, 0), 5)
            
            # Show above box too
            cv2.putText(frame, predicted_letter, (x1, y1-20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 3)
            
            # Print to terminal too
            print(f"👉 Detected: {predicted_letter} (Confidence: {confidence:.1%})")
        
        else:
            # No detection
            cv2.putText(frame, "No hand detected", (50, 80), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 3)
        
        # Show the frame
        cv2.imshow('YOLO Model Test - Press Q to Quit', frame)
        
        # Check for 'q' key to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("\n👋 Quitting...")
            break
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    print("✅ Done!")


if __name__ == "__main__":
    test_model_webcam()