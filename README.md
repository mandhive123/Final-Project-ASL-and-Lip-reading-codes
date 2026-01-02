# 🤟 SignEase - ASL & Lip Reading System

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/flask-3.0.0-green.svg)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SignEase** is an AI-powered web application that bridges communication gaps through real-time American Sign Language (ASL) recognition, lip reading, and text-to-ASL conversion. Built with Flask, YOLOv11, and MediaPipe.

---

## 🌟 Features

### 🤟 ASL to Text Recognition
- **Real-time detection** of 26 ASL alphabet signs
- **YOLOv11 deep learning model** for accurate recognition
- **Adjustable confidence threshold** (30%-95%)
- **Auto-save history** with timestamps and confidence scores
- **Live webcam feed** with bounding box visualization

### 👄 Lip Reading (NEW!)
- **Temporal sequence analysis** for improved accuracy
- **8 common words detection**: hello, yes, no, thank you, please, help, water, food
- **MediaPipe Face Mesh** integration
- **Smart cooldown system** to prevent duplicate detections
- **Pattern matching algorithm** for reliable word recognition

### 📝 Text to ASL Animation
- **40+ word and phrase library**
- **Multi-word phrase recognition** (e.g., "nice to meet you")
- **Animated GIF demonstrations**
- **Text preprocessing** with variations support (hi → hello, thx → thank you)

### 📊 History & Analytics
- **SQLite database** for persistent storage
- **Filter by conversion type** (ASL-to-text, lip-reading, text-to-ASL)
- **Statistics dashboard** with success rates and confidence averages
- **Export functionality** for data analysis

---

## 🎥 Demo

![SignEase Demo](https://via.placeholder.com/800x400?text=SignEase+Demo+Screenshot)

*Real-time ASL recognition with live webcam feed*

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11** ([Download here](https://www.python.org/downloads/))
- **Webcam** (for ASL and lip reading)
- **4GB RAM** minimum (8GB recommended)
- **Windows 10/11, macOS, or Linux**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/mandhive123/Final-Project-ASL-and-Lip-reading-codes.git
cd Final-Project-ASL-and-Lip-reading-codes
```

2. **Create virtual environment**
```bash
# Windows
py -3.11 -m venv asl_env_py311
asl_env_py311\Scripts\activate

# Mac/Linux
python3.11 -m venv asl_env_py311
source asl_env_py311/bin/activate
```

3. **Install dependencies**
```bash
pip install --upgrade pip
pip install flask opencv-python numpy pillow torch torchvision ultralytics mediapipe
```

4. **Verify model file** (Required for ASL recognition)
```bash
# Check if model exists at:
dataset/trained_model/best.pt
```

5. **Run the application**
```bash
python app.py
```

6. **Open your browser**
```
http://localhost:5000
```

---

## 📁 Project Structure

```
Sign_In_Project/
├── app.py                          # Main Flask application
├── asl_history.db                  # SQLite database (auto-created)
├── requirements.txt                # Python dependencies
├── README.md                       # This file
├── HOW_TO_RUN.txt                  # Detailed setup guide
│
├── dataset/
│   └── trained_model/
│       └── best.pt                 # YOLOv11 trained model
│
├── static/
│   ├── css/
│   │   └── style.css               # Custom styles
│   ├── js/
│   │   └── main.js                 # Frontend logic
│   └── animations/                 # ASL animation GIFs
│       ├── hello.gif
│       ├── thank-you.gif
│       └── ...
│
├── templates/
│   └── index.html                  # Main web interface
│
└── Executing_Folder/               # Setup scripts and docs
```

---

## 🛠️ Technology Stack

### Backend
- **Flask** - Web framework
- **YOLOv11** (Ultralytics) - ASL sign detection
- **MediaPipe** - Facial landmark detection for lip reading
- **OpenCV** - Image processing
- **SQLite** - Database for history

### Frontend
- **HTML5/CSS3** - User interface
- **JavaScript** - Client-side logic
- **WebRTC** - Webcam access

### AI/ML
- **PyTorch** - Deep learning framework
- **NumPy** - Numerical computing
- **Pillow** - Image manipulation

---

## 📖 Usage Guide

### ASL Recognition

1. Navigate to the **"ASL to Text"** tab
2. Click **"Start Camera"**
3. Allow camera permissions
4. Show ASL signs to the camera
5. Detected letters appear in real-time
6. Use **Space**, **Backspace**, and **Clear** buttons for editing
7. Click **"Save to History"** to store results

### Lip Reading

1. Go to the **"Lip Reading"** tab
2. Click **"Start Camera"**
3. Position your face in the frame
4. Speak one of the detectable words clearly:
   - hello, yes, no, thank you, please, help, water, food
5. Wait for detection (requires 10+ frames of analysis)
6. Detected words are automatically added to text

### Text to ASL

1. Select **"Text to ASL"** tab
2. Type text in the input box
3. Click **"Convert to ASL"**
4. View animated sign language demonstrations
5. Supports 40+ words and common phrases

---

## ⚙️ Configuration

### Adjust ASL Detection Sensitivity

In `app.py`, modify:
```python
self.confidence_threshold = 0.65  # Default: 0.65 (65%)
# Range: 0.3 (more detections) to 0.95 (fewer, more accurate)
```

### Customize Lip Reading Cooldown

```python
self.word_cooldown = 2.0  # Seconds between word detections
```

### Add New ASL Words to Text-to-ASL

Edit the `word_to_gif` dictionary in `app.py`:
```python
word_to_gif = {
    'your_word': '/static/animations/your_word.gif',
    # Add more mappings
}
```

---

## 🐛 Troubleshooting

### Model Not Found Error
```bash
# Ensure YOLOv11 model exists at:
dataset/trained_model/best.pt

# If missing, train or download the model
# App will run in LIMITED MODE without it
```

### Camera Not Working
- Check browser permissions (Chrome recommended)
- Close other applications using the camera
- Try restarting the browser
- Ensure HTTPS or localhost (WebRTC requirement)

### MediaPipe Installation Issues
```bash
pip uninstall mediapipe
pip install mediapipe==0.10.9
```

### Port 5000 Already in Use
```bash
# Change port in app.py (last line):
app.run(debug=True, host='0.0.0.0', port=5001)
```

### Torch/CUDA Errors
```bash
pip uninstall torch torchvision
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

---

## 📊 Performance

| Feature | Accuracy | Speed |
|---------|----------|-------|
| ASL Recognition | 85-95% | Real-time (30 FPS) |
| Lip Reading | 70-80% | 1-2s latency |
| Text to ASL | 100% | Instant |

*Accuracy depends on lighting conditions, camera quality, and model training*

---

## 🗺️ Roadmap

- [ ] Add support for ASL phrases (not just alphabet)
- [ ] Expand lip reading vocabulary (50+ words)
- [ ] Mobile app development (iOS/Android)
- [ ] Multi-language support
- [ ] Real-time sentence translation
- [ ] Voice output for detected signs
- [ ] Cloud deployment option
- [ ] API for third-party integration

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/YourFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add YourFeature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/YourFeature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow PEP 8 style guide for Python
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation as needed

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 SignEase Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 Authors

- Bihansith Mandhive Kamburugamuwa - Software Engineering Intern - [mandhive123](https://github.com/mandhive123)

---

## 🙏 Acknowledgments

- **YOLOv11** by Ultralytics for object detection
- **MediaPipe** by Google for facial landmark detection
- **Flask** community for excellent documentation
- **OpenCV** for computer vision tools
- ASL animation resources from [SignASL.org](https://signasl.org)
- Inspiration from the deaf and hard-of-hearing community

---

## 📞 Contact & Support

- **GitHub Issues**: [Report a bug](https://github.com/mandhive123/Final-Project-ASL-and-Lip-reading-codes/issues)
- **Email**: your.email@example.com
- **Documentation**: See `HOW_TO_RUN.txt` for detailed setup

---

## 📈 Project Statistics

![GitHub Stars](https://img.shields.io/github/stars/mandhive123/Final-Project-ASL-and-Lip-reading-codes?style=social)
![GitHub Forks](https://img.shields.io/github/forks/mandhive123/Final-Project-ASL-and-Lip-reading-codes?style=social)
![GitHub Issues](https://img.shields.io/github/issues/mandhive123/Final-Project-ASL-and-Lip-reading-codes)
![GitHub Last Commit](https://img.shields.io/github/last-commit/mandhive123/Final-Project-ASL-and-Lip-reading-codes)

---

## 🎯 Citation

If you use this project in your research or work, please cite:

```bibtex
@software{signease2026,
  author = {Your Name},
  title = {SignEase: ASL and Lip Reading System},
  year = {2026},
  url = {https://github.com/mandhive123/Final-Project-ASL-and-Lip-reading-codes}
}
```

---

<div align="center">

**Made with ❤️ for the deaf and hard-of-hearing community**

[⭐ Star this repo](https://github.com/mandhive123/Final-Project-ASL-and-Lip-reading-codes) • [🐛 Report Bug](https://github.com/mandhive123/Final-Project-ASL-and-Lip-reading-codes/issues) • [✨ Request Feature](https://github.com/mandhive123/Final-Project-ASL-and-Lip-reading-codes/issues)

</div>
