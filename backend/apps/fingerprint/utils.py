import face_recognition
import numpy as np

# 🔥 Encoder visage
def encode_face(image_file):
    image = face_recognition.load_image_file(image_file)
    encodings = face_recognition.face_encodings(image)

    if len(encodings) > 0:
        return encodings[0].tobytes()
    return None


# 🔍 Vérifier visage
def verify_face(stored_encoding, image_file):
    known = np.frombuffer(stored_encoding, dtype=np.float64)

    image = face_recognition.load_image_file(image_file)
    encodings = face_recognition.face_encodings(image)

    if len(encodings) == 0:
        return False

    unknown = encodings[0]

    result = face_recognition.compare_faces([known], unknown)
    return result[0]