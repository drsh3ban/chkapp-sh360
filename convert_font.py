import os

def convert():
    txt_path = 'c:/Users/pcx/CHK/web-app/android/font_b64.txt'
    js_path = 'c:/Users/pcx/CHK/web-app/src/utils/arabicFont.js'
    
    with open(txt_path, 'r') as f:
        b64 = f.read().replace('\n', '').replace('\r', '').strip()
    
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(f'export const ARABIC_FONT_BASE64 = "{b64}";\n')

if __name__ == "__main__":
    convert()
