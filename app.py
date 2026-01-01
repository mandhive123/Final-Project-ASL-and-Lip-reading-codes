"""
============================================
COMPLETE SIGNEASE APP - IMPROVED LIP READING
Fixed version with temporal sequence analysis and history system
============================================
"""

from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
import base64
import io
from PIL import Image
import logging
from datetime import datetime
import torch
import time
import sqlite3
from collections import defaultdict, deque
import torch.nn as nn
from pathlib import Path
import os

# YOLOv11 Import
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("ERROR: YOLOv11 not installed!")
    print("Install: pip install ultralytics")

# MediaPipe for Lip Reading
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    print("WARNING: MediaPipe not installed!")
    print("Lip reading will not work. Install: pip install mediapipe")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)


# ============================================
# DATABASE INITIALIZATION
# ============================================

def init_history_database():
    """Initialize SQLite database for conversion history"""
    try:
        conn = sqlite3.connect("asl_history.db")
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversion_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversion_type TEXT NOT NULL,
                input_text TEXT,
                output_text TEXT,
                confidence REAL,
                method TEXT,
                duration REAL,
                metadata TEXT,
                timestamp REAL,
                date TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Database initialization error: {e}")


# ============================================
# ASL RECOGNITION SYSTEM
# ============================================

class YOLODetector:
    """YOLOv11 detector for ASL signs"""
    
    def __init__(self, model_path="dataset/trained_model/best.pt"):
        self.model_path = model_path
        self.model = None
        self.is_available = False
        self.confidence_threshold = 0.65
        self.class_names = []
        
        if YOLO_AVAILABLE:
            self.load_model()
    
    def load_model(self):
        """Load YOLO model"""
        try:
            if not os.path.exists(self.model_path):
                logger.error(f"Model not found: {self.model_path}")
                return False
            
            self.model = YOLO(self.model_path)
            self.class_names = list(self.model.names.values())
            self.is_available = True
            logger.info(f"YOLO model loaded: {len(self.class_names)} classes")
            return True
            
        except Exception as e:
            logger.error(f"Model loading error: {e}")
            return False
    
    def detect(self, image):
        """Run detection on image"""
        if not self.is_available or self.model is None:
            return None, 0.0
        
        try:
            results = self.model(image, conf=self.confidence_threshold, verbose=False)
            
            if len(results) > 0 and len(results[0].boxes) > 0:
                box = results[0].boxes[0]
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                prediction = self.class_names[class_id]
                
                return prediction, confidence
            
            return None, 0.0
            
        except Exception as e:
            logger.error(f"Detection error: {e}")
            return None, 0.0


class ASLRecognitionSystem:
    """Main ASL recognition system"""
    
    def __init__(self):
        self.detector = YOLODetector()
        self.current_text = ""
        self.last_prediction = None
        self.last_time = 0
        self.cooldown = 1.5
        self.stats = {
            'total_detections': 0,
            'successful_detections': 0,
            'total_confidence': 0.0
        }
    
    def process_image(self, image_data):
        """Process base64 image and return prediction"""
        try:
            image_bytes = base64.b64decode(image_data.split(',')[1])
            image = Image.open(io.BytesIO(image_bytes))
            frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            prediction, confidence = self.detector.detect(frame)
            
            self.stats['total_detections'] += 1
            
            if prediction and confidence > self.detector.confidence_threshold:
                self.stats['successful_detections'] += 1
                self.stats['total_confidence'] += confidence
                
                current_time = time.time()
                if current_time - self.last_time > self.cooldown:
                    if prediction != self.last_prediction:
                        self.current_text += prediction
                        self.last_prediction = prediction
                        self.last_time = current_time
                
                return {
                    "prediction": prediction,
                    "confidence": float(confidence),
                    "current_text": self.current_text,
                    "status": "success"
                }
            
            return {
                "prediction": "No Hand",
                "confidence": 0.0,
                "current_text": self.current_text,
                "status": "no_detection"
            }
            
        except Exception as e:
            logger.error(f"Process image error: {e}")
            return {
                "prediction": "Error",
                "confidence": 0.0,
                "current_text": self.current_text,
                "status": "error",
                "error": str(e)
            }
    
    def clear_text(self):
        """Clear current text"""
        self.current_text = ""
        self.last_prediction = None
    
    def add_space(self):
        """Add space to text"""
        if self.current_text and not self.current_text.endswith(" "):
            self.current_text += " "
    
    def backspace(self):
        """Remove last character"""
        if self.current_text:
            self.current_text = self.current_text[:-1]
    
    def get_stats(self):
        """Get system statistics"""
        avg_confidence = 0.0
        if self.stats['successful_detections'] > 0:
            avg_confidence = self.stats['total_confidence'] / self.stats['successful_detections']
        
        return {
            'total_detections': self.stats['total_detections'],
            'successful_detections': self.stats['successful_detections'],
            'average_confidence': avg_confidence,
            'model_path': self.detector.model_path,
            'total_classes': len(self.detector.class_names),
            'available_signs': self.detector.class_names
        }


# ============================================
# LIP READING SYSTEM
# ============================================

class ImprovedLipReadingDetector:
    """Improved lip reading with temporal sequence analysis"""
    
    def __init__(self):
        self.is_available = False
        self.face_mesh = None
        self.current_text = ""
        self.last_word = None
        self.last_word_time = 0
        self.word_cooldown = 2.0
        
        # Temporal tracking
        self.openness_history = deque(maxlen=30)
        self.movement_history = deque(maxlen=30)
        self.min_sequence_length = 10
        
        # Enhanced word patterns with temporal features
        self.word_patterns = {
            'hello': {'open_ratio': 0.35, 'movement': 0.12, 'duration': 0.8, 'pattern': [0.2, 0.4, 0.3]},
            'yes': {'open_ratio': 0.25, 'movement': 0.08, 'duration': 0.5, 'pattern': [0.2, 0.3, 0.2]},
            'no': {'open_ratio': 0.20, 'movement': 0.15, 'duration': 0.6, 'pattern': [0.2, 0.2, 0.2]},
            'thank you': {'open_ratio': 0.30, 'movement': 0.10, 'duration': 1.0, 'pattern': [0.3, 0.4, 0.2]},
            'please': {'open_ratio': 0.28, 'movement': 0.09, 'duration': 0.7, 'pattern': [0.2, 0.3, 0.3]},
            'help': {'open_ratio': 0.32, 'movement': 0.11, 'duration': 0.6, 'pattern': [0.3, 0.4, 0.2]},
            'water': {'open_ratio': 0.30, 'movement': 0.10, 'duration': 0.8, 'pattern': [0.3, 0.3, 0.3]},
            'food': {'open_ratio': 0.35, 'movement': 0.08, 'duration': 0.6, 'pattern': [0.4, 0.3, 0.2]},
        }
        
        self.stats = {
            'total_frames': 0,
            'detections': 0,
            'words_detected': 0
        }
        
        if MEDIAPIPE_AVAILABLE:
            self.initialize_mediapipe()
    
    def initialize_mediapipe(self):
        """Initialize MediaPipe face mesh"""
        try:
            self.face_mesh = mp.solutions.face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self.is_available = True
            logger.info("MediaPipe initialized for lip reading")
        except Exception as e:
            logger.error(f"MediaPipe initialization error: {e}")
    
    def calculate_lip_features(self, landmarks):
        """Calculate comprehensive lip features"""
        # Key lip landmarks
        upper_lip = landmarks[13]
        lower_lip = landmarks[14]
        left_corner = landmarks[61]
        right_corner = landmarks[291]
        
        # Vertical openness
        vertical_dist = abs(upper_lip.y - lower_lip.y)
        
        # Horizontal width
        horizontal_dist = abs(left_corner.x - right_corner.x)
        
        # Openness ratio
        openness = vertical_dist / (horizontal_dist + 1e-6)
        
        return {
            'openness': openness,
            'vertical': vertical_dist,
            'horizontal': horizontal_dist
        }
    
    def analyze_temporal_sequence(self):
        """Analyze temporal sequence for word detection"""
        if len(self.openness_history) < self.min_sequence_length:
            return None, 0.0
        
        # Calculate sequence statistics
        openness_values = list(self.openness_history)
        movement_values = list(self.movement_history)
        
        avg_openness = np.mean(openness_values)
        avg_movement = np.mean(movement_values)
        std_openness = np.std(openness_values)
        
        # Pattern matching against known words
        best_match = None
        best_score = 0.0
        
        for word, pattern in self.word_patterns.items():
            # Calculate similarity score
            openness_score = 1.0 - abs(avg_openness - pattern['open_ratio']) / (pattern['open_ratio'] + 0.1)
            movement_score = 1.0 - abs(avg_movement - pattern['movement']) / (pattern['movement'] + 0.05)
            
            # Temporal pattern correlation
            if len(openness_values) >= 3:
                sequence_thirds = [
                    np.mean(openness_values[:len(openness_values)//3]),
                    np.mean(openness_values[len(openness_values)//3:2*len(openness_values)//3]),
                    np.mean(openness_values[2*len(openness_values)//3:])
                ]
                pattern_score = 1.0 - np.mean([abs(sequence_thirds[i] - pattern['pattern'][i]) 
                                               for i in range(3)])
            else:
                pattern_score = 0.5
            
            # Combined score
            total_score = (openness_score * 0.4 + movement_score * 0.3 + pattern_score * 0.3)
            
            if total_score > best_score and total_score > 0.6:
                best_score = total_score
                best_match = word
        
        return best_match, best_score
    
    def process_frame(self, frame):
        """Process frame for lip reading"""
        if not self.is_available:
            return None, 0.0, None, "MediaPipe not available", {}
        
        self.stats['total_frames'] += 1
        
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_frame)
            
            if not results.multi_face_landmarks:
                self.openness_history.clear()
                self.movement_history.clear()
                return None, 0.0, None, "No face detected", {}
            
            landmarks = results.multi_face_landmarks[0].landmark
            
            # Calculate features
            features = self.calculate_lip_features(landmarks)
            
            # Update temporal history
            self.openness_history.append(features['openness'])
            
            if len(self.openness_history) >= 2:
                movement = abs(self.openness_history[-1] - self.openness_history[-2])
                self.movement_history.append(movement)
            
            # Analyze sequence
            word, confidence = self.analyze_temporal_sequence()
            
            # Apply cooldown
            current_time = time.time()
            if word and confidence > 0.65:
                if current_time - self.last_word_time > self.word_cooldown:
                    if word != self.last_word:
                        self.current_text += word + " "
                        self.last_word = word
                        self.last_word_time = current_time
                        self.stats['words_detected'] += 1
                        self.stats['detections'] += 1
                        
                        # Clear history after detection
                        self.openness_history.clear()
                        self.movement_history.clear()
            
            # Bounding box
            h, w = frame.shape[:2]
            x_coords = [landmarks[i].x * w for i in [61, 291, 13, 14]]
            y_coords = [landmarks[i].y * h for i in [61, 291, 13, 14]]
            bbox = [min(x_coords), min(y_coords), max(x_coords), max(y_coords)]
            
            status = f"Analyzing... ({len(self.openness_history)}/{self.min_sequence_length} frames)"
            
            return word, confidence, bbox, status, features
            
        except Exception as e:
            logger.error(f"Lip reading error: {e}")
            return None, 0.0, None, f"Error: {str(e)}", {}
    
    def clear_text(self):
        """Clear detected text"""
        self.current_text = ""
        self.last_word = None
        self.openness_history.clear()
        self.movement_history.clear()


# ============================================
# INITIALIZE SYSTEMS
# ============================================

init_history_database()
asl_system = ASLRecognitionSystem()
lip_reading_system = ImprovedLipReadingDetector() if MEDIAPIPE_AVAILABLE else None

# ============================================
# FLASK ROUTES
# ============================================

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/predict_asl', methods=['POST'])
def predict_asl():
    """Main ASL prediction endpoint with auto-save"""
    try:
        data = request.json
        image_data = data.get('image', '')
        
        if not image_data:
            return jsonify({"error": "No image data"}), 400
        
        result = asl_system.process_image(image_data)
        
        if result.get('prediction') and result.get('prediction') not in ['No Hand', 'Error', None]:
            try:
                conn = sqlite3.connect("asl_history.db")
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO conversion_history 
                    (conversion_type, input_text, output_text, confidence, method, duration, metadata, timestamp, date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    'asl-to-text',
                    'Camera Input',
                    result.get('prediction', ''),
                    result.get('confidence', 0.0),
                    'YOLOv11',
                    0.0,
                    str({"sign": result.get('prediction')}),
                    time.time(),
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                ))
                conn.commit()
                conn.close()
            except Exception as save_error:
                logger.warning(f"Failed to auto-save history: {save_error}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/predict_lip', methods=['POST'])
def predict_lip():
    """Lip reading prediction endpoint with auto-save"""
    try:
        if not MEDIAPIPE_AVAILABLE or lip_reading_system is None:
            return jsonify({
                "error": "MediaPipe not available",
                "message": "Install: pip install mediapipe"
            }), 503
        
        data = request.json
        image_data = data.get('image', '')
        
        if not image_data:
            return jsonify({"error": "No image data"}), 400
        
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        word, confidence, bbox, status, features = lip_reading_system.process_frame(frame)
        
        if word and confidence > 0.6 and word not in ['No Face', 'Analyzing...', None]:
            try:
                conn = sqlite3.connect("asl_history.db")
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO conversion_history 
                    (conversion_type, input_text, output_text, confidence, method, duration, metadata, timestamp, date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    'lip-reading',
                    'Lip Movement',
                    word,
                    confidence,
                    'MediaPipe + Pattern Matching',
                    0.0,
                    str({"word": word}),
                    time.time(),
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                ))
                conn.commit()
                conn.close()
            except Exception as save_error:
                logger.warning(f"Failed to auto-save history: {save_error}")
        
        response = {
            "prediction": word if word else "Analyzing...",
            "confidence": float(confidence) if confidence else 0.0,
            "current_text": lip_reading_system.current_text,
            "status": status,
            "bbox": [int(b) for b in bbox] if bbox else None,
            "features": features,
            "stats": lip_reading_system.stats,
            "detectable_words": list(lip_reading_system.word_patterns.keys()),
            "sequence_length": len(lip_reading_system.openness_history),
            "min_required": lip_reading_system.min_sequence_length
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Lip prediction error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route('/clear_text', methods=['POST'])
def clear_text():
    """Clear ASL text output"""
    asl_system.clear_text()
    return jsonify({"status": "success", "text": ""})


@app.route('/add_space', methods=['POST'])
def add_space():
    """Add space to ASL text"""
    asl_system.add_space()
    return jsonify({"status": "success", "text": asl_system.current_text})


@app.route('/backspace', methods=['POST'])
def backspace():
    """Remove last character from ASL text"""
    asl_system.backspace()
    return jsonify({"status": "success", "text": asl_system.current_text})


@app.route('/clear_lip_text', methods=['POST'])
def clear_lip_text():
    """Clear lip reading text"""
    if lip_reading_system:
        lip_reading_system.clear_text()
    return jsonify({"status": "success", "text": ""})


@app.route('/get_stats', methods=['GET'])
def get_stats():
    """Get ASL system statistics"""
    return jsonify(asl_system.get_stats())


@app.route('/lip_stats', methods=['GET'])
def lip_stats():
    """Get lip reading statistics"""
    if not lip_reading_system:
        return jsonify({"error": "Lip reading not available"}), 503
    
    return jsonify({
        "stats": lip_reading_system.stats,
        "current_text": lip_reading_system.current_text,
        "detectable_words": list(lip_reading_system.word_patterns.keys()),
        "sequence_length": len(lip_reading_system.openness_history),
        "cooldown": lip_reading_system.word_cooldown
    })


@app.route('/get_history', methods=['GET'])
def get_history():
    """Get conversion history"""
    try:
        limit = request.args.get('limit', 100, type=int)
        conversion_type = request.args.get('type', None)
        
        conn = sqlite3.connect("asl_history.db")
        cursor = conn.cursor()
        
        if conversion_type and conversion_type != 'all':
            query = '''
                SELECT id, conversion_type, input_text, output_text, confidence, 
                       method, duration, timestamp, date
                FROM conversion_history 
                WHERE conversion_type = ?
                ORDER BY id DESC 
                LIMIT ?
            '''
            cursor.execute(query, (conversion_type, limit))
        else:
            query = '''
                SELECT id, conversion_type, input_text, output_text, confidence, 
                       method, duration, timestamp, date
                FROM conversion_history 
                ORDER BY id DESC 
                LIMIT ?
            '''
            cursor.execute(query, (limit,))
        
        history = []
        for row in cursor.fetchall():
            history.append({
                "id": row[0],
                "conversion_type": row[1],
                "input_text": row[2],
                "output_text": row[3],
                "confidence": row[4],
                "method": row[5],
                "duration": row[6],
                "timestamp": row[7],
                "date": row[8]
            })
        
        conn.close()
        
        return jsonify({
            "status": "success",
            "history": history,
            "count": len(history)
        })
        
    except Exception as e:
        logger.error(f"Get history error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/get_statistics', methods=['GET'])
def get_statistics():
    """Get conversion statistics"""
    try:
        conn = sqlite3.connect("asl_history.db")
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM conversion_history')
        total_conversions = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT conversion_type, COUNT(*) 
            FROM conversion_history 
            GROUP BY conversion_type
        ''')
        by_type = dict(cursor.fetchall())
        
        cursor.execute('SELECT AVG(confidence) FROM conversion_history WHERE confidence > 0')
        avg_confidence = cursor.fetchone()[0] or 0.0
        
        conn.close()
        
        return jsonify({
            "status": "success",
            "statistics": {
                "total_conversions": total_conversions,
                "by_type": by_type,
                "average_confidence": avg_confidence
            }
        })
        
    except Exception as e:
        logger.error(f"Statistics error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/delete_history/<int:entry_id>', methods=['DELETE'])
def delete_history_entry(entry_id):
    """Delete a single history entry"""
    try:
        conn = sqlite3.connect("asl_history.db")
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM conversion_history WHERE id = ?', (entry_id,))
        conn.commit()
        
        deleted = cursor.rowcount > 0
        conn.close()
        
        if deleted:
            logger.info(f"Deleted history entry: {entry_id}")
            return jsonify({"status": "success", "message": "Entry deleted"})
        else:
            return jsonify({"status": "error", "message": "Entry not found"}), 404
            
    except Exception as e:
        logger.error(f"Delete error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/save_history', methods=['POST'])
def save_history():
    """Save conversion to history (called from frontend)"""
    try:
        data = request.json
        
        conn = sqlite3.connect("asl_history.db")
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO conversion_history 
            (conversion_type, input_text, output_text, confidence, method, duration, metadata, timestamp, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('type', 'unknown'),
            data.get('input', ''),
            data.get('output', ''),
            data.get('confidence', 0.0),
            data.get('method', ''),
            data.get('duration', 0.0),
            str(data.get('metadata', {})),
            time.time(),
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Saved history: {data.get('type')}")
        
        return jsonify({
            "status": "success",
            "message": "History saved"
        })
        
    except Exception as e:
        logger.error(f"Save history error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/convert_text_to_asl', methods=['POST'])
def convert_text_to_asl():
    """Convert text to ASL animations"""
    try:
        data = request.json
        text = data.get('text', '').strip().lower()
        
        if not text:
            return jsonify({'status': 'error', 'error': 'No text provided'})
        
        logger.info(f"Converting text to ASL: {text}")
        
        word_to_gif = {
            'hello': '/static/animations/hello.gif',
            'hi': '/static/animations/hello.gif',
            'goodbye': '/static/animations/goodbye.gif',
            'bye': '/static/animations/goodbye.gif',
            'thank you': '/static/animations/thank-you.gif',
            'thanks': '/static/animations/thank-you.gif',
            'please': '/static/animations/please.gif',
            'yes': '/static/animations/yes.gif',
            'no': '/static/animations/no.gif',
            'sorry': '/static/animations/sorry.gif',
            'want': '/static/animations/want.gif',
            'help': '/static/animations/help.gif',
            'love': '/static/animations/i-love-you.gif',
            'happy': '/static/animations/happy.gif',
            'sad': '/static/animations/sad.gif',
            'good': '/static/animations/good.gif',
            'bad': '/static/animations/bad.gif',
            'water': '/static/animations/water.gif',
            'food': '/static/animations/food.gif',
            'eat': '/static/animations/eat.gif',
            'drink': '/static/animations/drink.gif',
            'sleep': '/static/animations/sleep.gif',
            'home': '/static/animations/home.gif',
            'family': '/static/animations/family.gif',
            'friend': '/static/animations/friend.gif',
            'go': '/static/animations/go.gif',
            'me': '/static/animations/me.gif',
            'to': '/static/animations/to.gif',
            'walk': '/static/animations/walk.gif',
            'back': '/static/animations/back.gif',
            'you': '/static/animations/you.gif',
            'work': '/static/animations/work.gif',
            'name': '/static/animations/name.gif',
            'meet': '/static/animations/meet.gif',
            'nice': '/static/animations/nice.gif',
            'here': '/static/animations/here.gif',
            'how are you': '/static/animations/how-are-you.gif',
            'applause': '/static/animations/applause.gif',
            'i love you': '/static/animations/i-love-you.gif',
            'good morning': '/static/animations/good-morning.gif',
            'nice to meet you': '/static/animations/nice-to-meet-you.gif',
            'pardon': '/static/animations/Pardon.gif',
            'good night': '/static/animations/goodnight.gif',
            'good afternoon': '/static/animations/afternoon.gif',
            'are you here': '/static/animations/here.gif',
            'see you again': '/static/animations/again.gif'
        }
        
        multi_word_phrases = [
            'nice to meet you',
            'are you here',
            'see you again',
            'see you later',
            'how are you',
            'thank you',
            'i love you',
            'good morning',
            'good night',
            'good afternoon',
            'good evening',
            'excuse me',
            'you are welcome',
            'what is your name',
            'pleased to meet you'
        ]
        
        variations = {
            'hi': 'hello',
            'hey': 'hello',
            'greetings': 'hello',
            'bye': 'goodbye',
            'farewell': 'goodbye',
            'thanks': 'thank you',
            'thank': 'thank you',
            'thx': 'thank you',
            'plz': 'please',
            'yeah': 'yes',
            'yep': 'yes',
            'yup': 'yes',
            'nope': 'no',
            'nah': 'no',
            'wanna': 'want'
        }
        
        import re
        cleaned = re.sub(r'[^\w\s\']', ' ', text.lower()).strip()
        cleaned = re.sub(r'\s+', ' ', cleaned)
        
        if not cleaned:
            return jsonify({'status': 'error', 'error': 'No valid text after cleaning'})
        
        words = []
        animations = []
        tokens = cleaned.split()
        used_indices = set()
        
        for i in range(len(tokens)):
            if i in used_indices:
                continue
            
            matched = False
            for phrase_len in range(min(6, len(tokens) - i), 1, -1):
                candidate = ' '.join(tokens[i:i+phrase_len])
                if candidate in multi_word_phrases:
                    words.append(candidate)
                    animations.append(word_to_gif.get(candidate, ''))
                    for j in range(i, i + phrase_len):
                        used_indices.add(j)
                    matched = True
                    break
            
            if not matched:
                word = tokens[i]
                word = variations.get(word, word)
                words.append(word)
                animations.append(word_to_gif.get(word, ''))
                used_indices.add(i)
        
        logger.info(f"Converted to {len(words)} words: {words}")
        
        return jsonify({
            'status': 'success',
            'words': words,
            'animations': animations,
            'count': len(words)
        })
        
    except Exception as e:
        logger.error(f"Text to ASL error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'status': 'error', 'error': str(e)})


@app.route('/clear_history', methods=['POST'])
def clear_history():
    """Clear all or filtered history"""
    try:
        data = request.json
        conversion_type = data.get('type', None)
        
        conn = sqlite3.connect("asl_history.db")
        cursor = conn.cursor()
        
        if conversion_type:
            cursor.execute('DELETE FROM conversion_history WHERE conversion_type = ?', (conversion_type,))
            message = f"Cleared {conversion_type} history"
        else:
            cursor.execute('DELETE FROM conversion_history')
            message = "Cleared all history"
        
        conn.commit()
        deleted_count = cursor.rowcount
        conn.close()
        
        logger.info(f"{message} ({deleted_count} entries)")
        
        return jsonify({
            "status": "success",
            "message": message,
            "deleted_count": deleted_count
        })
        
    except Exception as e:
        logger.error(f"Clear history error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/system_status', methods=['GET'])
def system_status():
    """Get detailed system status"""
    stats = asl_system.get_stats()
    
    return jsonify({
        "yolo": {
            "available": asl_system.detector.is_available,
            "model_path": stats.get('model_path', 'Not found'),
            "total_classes": stats.get('total_classes', 0),
            "detections": stats.get('successful_detections', 0),
            "accuracy": f"{stats.get('average_confidence', 0) * 100:.1f}%",
            "confidence_threshold": asl_system.detector.confidence_threshold
        },
        "signs": {
            "available": stats.get('available_signs', []),
            "total": len(stats.get('available_signs', []))
        },
        "text": {
            "current": asl_system.current_text,
            "length": len(asl_system.current_text)
        }
    })


@app.route('/adjust_sensitivity', methods=['POST'])
def adjust_sensitivity():
    """Adjust ASL detection sensitivity"""
    try:
        data = request.json
        confidence = data.get('confidence', 0.65)
        
        asl_system.detector.confidence_threshold = max(0.3, min(0.95, confidence))
        
        logger.info(f"Sensitivity adjusted: confidence={confidence}")
        
        return jsonify({
            "status": "success",
            "confidence_threshold": asl_system.detector.confidence_threshold
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    print("\n" + "=" * 80)
    print("SIGNEASE - ASL & IMPROVED LIP READING")
    print("=" * 80)
    
    if asl_system.detector.is_available:
        print("ASL Recognition: READY")
        print(f"Signs: {len(asl_system.detector.class_names)}")
        print(f"Classes: {', '.join(asl_system.detector.class_names[:5])}...")
    else:
        print("ASL Recognition: LIMITED MODE (Model not loaded)")
    
    print("")
    
    if MEDIAPIPE_AVAILABLE and lip_reading_system and lip_reading_system.is_available:
        print("Lip Reading: READY (Temporal Sequence Analysis)")
        print(f"Words: {len(lip_reading_system.word_patterns)}")
        print(f"Detectable: {', '.join(list(lip_reading_system.word_patterns.keys())[:5])}...")
        print(f"Min sequence: {lip_reading_system.min_sequence_length} frames")
        print(f"Cooldown: {lip_reading_system.word_cooldown}s between words")
    else:
        print("Lip Reading: DISABLED")
        print("Install: pip install mediapipe")
    
    print("=" * 80)
    print("Server: http://localhost:5000")
    print("=" * 80 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)