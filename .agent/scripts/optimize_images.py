import os
from PIL import Image

def optimize_images(directory):
    print(f"Otimizando imagens em: {directory}")
    total_saved = 0
    
    for filename in os.listdir(directory):
        if filename.lower().endswith('.png') or filename.lower().endswith('.jpg') or filename.lower().endswith('.jpeg'):
            filepath = os.path.join(directory, filename)
            size = os.path.getsize(filepath)
            
            # Só otimiza se for maior que 500KB
            if size > 500 * 1024:
                print(f"Otimizando {filename} ({size/1024:.2f}KB)...")
                try:
                    img = Image.open(filepath)
                    
                    # Resize se muito grande (max 1024px width)
                    if img.width > 1024:
                        ratio = 1024 / img.width
                        new_height = int(img.height * ratio)
                        img = img.resize((1024, new_height), Image.Resampling.LANCZOS)
                    
                    # Save optimized
                    img.save(filepath, optimize=True, quality=85)
                    
                    new_size = os.path.getsize(filepath)
                    saved = size - new_size
                    total_saved += saved
                    print(f"  -> Reduzido para {new_size/1024:.2f}KB (Economia: {saved/1024:.2f}KB)")
                    
                except Exception as e:
                    print(f"  -> Erro ao otimizar: {e}")

    print(f"\nTotal economizado: {total_saved/1024/1024:.2f} MB")

if __name__ == "__main__":
    optimize_images('public')
