
import sys

def append_part(source_file, start_line, end_line, target_file):
    try:
        with open(source_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        start_idx = start_line - 1
        end_idx = end_line 
        
        extracted_lines = lines[start_idx:end_idx]
        
        with open(target_file, 'a', encoding='utf-8') as f: # Append mode
            f.writelines(extracted_lines)
            
        print(f"Successfully appended lines {start_line} to {end_line} into {target_file}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python append_part.py <source> <start> <end> <target>")
        sys.exit(1)
        
    append_part(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4])
