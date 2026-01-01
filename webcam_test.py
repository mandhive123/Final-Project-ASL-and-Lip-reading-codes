from ultralytics import YOLO

model = YOLO("dataset/trained_model/best.pt")

model.predict(
    source=0,
    conf=0.15,
    imgsz=640,
    show=True
)
