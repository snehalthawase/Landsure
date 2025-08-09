from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from PIL import Image
import io

from util import preprocess_image, format_text, extract_text_line_by_line, extract_structured_info

app = Flask(__name__)
CORS(app)  # Don't forget this for frontend API calls

@app.route('/ocr', methods=['POST'])
def ocr_handler():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    in_memory_file = file.read()
    npimg = np.frombuffer(in_memory_file, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    try:
        preprocessed = preprocess_image(img)
        text = extract_text_line_by_line(preprocessed)
        structured = extract_structured_info(text)

        return jsonify(structured)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
