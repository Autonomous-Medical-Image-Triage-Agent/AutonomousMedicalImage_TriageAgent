"""
Downloads model weights from Google Drive into the ./models directory.
Usage:
    python download_weights.py
"""
import os
import gdown

FOLDER_ID = "1rq5_Poy51CNB9rm4DiHvsRohCMU0fb3c"
FOLDER_URL = f"https://drive.google.com/drive/folders/{FOLDER_ID}"
MODEL_DIR = os.environ.get("MODEL_DIR", "./models")

EXPECTED_FILES = [
    "densenet_121_best.pth",
    "efficientnet_b0_best.pth",
    "efficientnet_b3_best.pth",
    "resnet_50_best.pth",
]


def download():
    os.makedirs(MODEL_DIR, exist_ok=True)

    # Check if all weights already present
    missing = [f for f in EXPECTED_FILES if not os.path.exists(os.path.join(MODEL_DIR, f))]
    if not missing:
        print("All model weights already present — skipping download.")
        return

    print(f"Downloading model weights from Google Drive folder...")
    print(f"Destination: {os.path.abspath(MODEL_DIR)}\n")

    try:
        gdown.download_folder(
            url=FOLDER_URL,
            output=MODEL_DIR,
            quiet=False,
            use_cookies=False,
        )
        print("\nDownload complete.")
    except Exception as e:
        print(f"\nFolder download failed: {e}")
        print("The folder may not be publicly shared.")
        print("To fix: in Google Drive, right-click the folder → Share → 'Anyone with the link' → Viewer")


if __name__ == "__main__":
    download()
