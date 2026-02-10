
import sys

def replace_header(target_file, new_header_file, lines_to_skip):
    try:
        with open(new_header_file, 'r', encoding='utf-8') as f:
            header_content = f.read()
            
        with open(target_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        # Skip lines
        rest_of_content = lines[lines_to_skip:]
        
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(header_content)
            f.writelines(rest_of_content)
            
        print(f"Successfully replaced header of {target_file}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python replace_header.py <target_file> <new_header_file> <lines_to_skip>")
        sys.exit(1)
        
    replace_header(sys.argv[1], sys.argv[2], int(sys.argv[3]))
