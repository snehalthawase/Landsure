import re
import cv2
import numpy as np
import pytesseract

def preprocess_image(image):
    """
    Preprocess the image using advanced upscaling, adaptive thresholding, and noise reduction.
    """
    scale_percent = 150
    width = int(image.shape[1] * scale_percent / 100)
    height = int(image.shape[0] * scale_percent / 100)
    image = cv2.resize(image, (width, height), interpolation=cv2.INTER_CUBIC)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.convertScaleAbs(gray, alpha=1.5, beta=0)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)

    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 11, 2
    )

    kernel = np.ones((2, 2), np.uint8)
    thresh = cv2.dilate(thresh, kernel, iterations=1)

    return thresh


def clean_extracted_text(text):
    """
    Clean OCR text while preserving meaningful formatting (like line breaks).
    Removes non-ASCII characters and extra spaces, but retains structure.
    """
    text = re.sub(r'[^\x00-\x7F]+', '', text)  # Remove non-ASCII
    text = re.sub(r'[ \t]+', ' ', text)        # Replace multiple spaces/tabs with one space
    text = re.sub(r'\n{2,}', '\n', text)       # Replace multiple newlines with a single newline
    text = re.sub(r"\*\*", "", text)
    return text.strip()



def save_text_to_file(text, filename="notes.txt"):
    """
    Save cleaned text to a file.
    """
    with open(filename, "w", encoding="utf-8") as f:
        f.write(text)
    return filename


def format_text(text, correct_spelling=False):
    """
    Clean and format OCR text for readability.
    """
    # Normalize and remove common OCR artifacts
    text = text.replace("—", "-").replace("–", "-").replace("_", " ")
    text = re.sub(r"[|~•*]", "", text)
    text = re.sub(r"[-=]{2,}", "-", text)
    text = re.sub(r"\s{2,}", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)

    # Common OCR correction map
    corrections = {
        "Improoved": "Improved",
        "Nowe": "Noise",
        "etrective": "Effective",
        "monsuntfonn handiwrie": "non-uniform handwriting",
        "handiwrie": "handwriting",
        "multple": "multiple",
        "te": "to",
        "etye": "style",
        "bettor": "better",
        "certificato": "certificate",
        "Stato": "State",
        "locatod": "located",
        "disputo": "dispute",
        "Dato": "Date",
        "Knata": "Khata"
    }

    for wrong, correct in corrections.items():
        text = text.replace(wrong, correct)

    lines = text.split("\n")
    formatted_lines = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Properly format headers
        if line.isupper() and len(line) > 3:
            formatted_lines.append(f"\n### {line.title()}\n")
        # Format colon-separated key-value pairs
        elif ":" in line:
            parts = line.split(":", 1)
            key = parts[0].strip().capitalize()
            value = parts[1].strip()
            formatted_lines.append(f"**{key}:** {value}")
        else:
            formatted_lines.append(line)

    return "\n".join(formatted_lines)


def extract_text_line_by_line(image):
    """
    Extract and format OCR text line by line.
    """
    text = pytesseract.image_to_string(image, config='--psm 6')
    lines = text.split("\n")
    formatted_lines = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        if line.isupper() and len(line) > 3:
            formatted_lines.append(f"\n### {line.title()}\n")
        elif ":" in line:
            parts = line.split(":", 1)
            key = parts[0].strip().capitalize()
            value = parts[1].strip()
            formatted_lines.append(f"**{key}:** {value}")
        else:
            formatted_lines.append(line)

    return "\n".join(formatted_lines)




def extract_structured_info(formatted_text):
    formatted_text = clean_extracted_text(formatted_text)

    def clean_value(value):
        if "This is to certify" in value:
            value = value.split("This is to certify")[0]
        return value.strip(" .")

    patterns = {
        "certificate_id": r"(?:Certificato|Certificate)\s*id[:\-]?\s*([A-Z0-9\-\/]+)",
        "district": r"District\s*[:\-]?\s*([A-Za-z\s]+)",
        "owner": r"certify that\s+([A-Z][a-zA-Z\s]*)[\,\.]",
        "age": r"Aged\s+(\d+)\s+years",
        "survey_no": r"Survey\s+Number\s+([\w\/]+)",
        "khata_no": r"Khata\s+Number\s*([\w\/]+)",
        "plot_no": r"Plot\s+Number\s*([\w\/]+)",
        "area": r"measuring\s+([\d\.]+\s*(?:acres|sq\.?\s*meters|sq\.?\s*feet)?)",
        "village": r"village\s+of\s+([A-Za-z\s]+)[,\.]",
        "state": r"State\s+([A-Za-z\s]+)",
        "land_type": r"classified\s+as\s+([A-Za-z\s]+)",
        "date": r"(?:Date|date)[:\-]?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})"
    }

    extracted_info = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, formatted_text, flags=re.IGNORECASE)
        if match:
            raw_value = match.group(1).strip()
            extracted_info[key] = clean_value(raw_value).strip()
        else:
            extracted_info[key] = None

    return extracted_info

            




def extract_keywords(text):
    """
    [Optional] Extract structured key fields from formatted certificate text.
    Useful for tokenization or data parsing.
    """
    data = {}

    patterns = {
        "certificate_id": r"Certificato id:\s*(\S+)",
        "owner": r"certify that\s+(.*?)\,",
        "survey_no": r"Survey Number\s+(\S+)",
        "khata_no": r"Khata Number\s+(\S+)",
        "plot_no": r"Plot Number\s+(\S+)",
        "area": r"measuring\s+([\d.]+\s+\w+)",
        "village": r"village of\s+(.*?),",
        "district": r"District\s+(\w+)",
        "state": r"State\s+(\w+)",
        "classification": r"classified as\s+(\w+)",
        "date": r"Date:\s+([0-9/]+)"
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data[key] = match.group(1).strip()

    return data
