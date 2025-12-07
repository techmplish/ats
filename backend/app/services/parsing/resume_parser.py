import os
import re
import fitz  # PyMuPDF
import docx

class ResumeParser:
    @staticmethod
    def extract_text(file_path):
        """Extracts text from PDF or DOCX file."""
        ext = os.path.splitext(file_path)[1].lower()
        text = ""
        
        try:
            if ext == '.pdf':
                with fitz.open(file_path) as doc:
                    for page in doc:
                        text += page.get_text()
            elif ext in ['.docx', '.doc']:
                doc = docx.Document(file_path)
                for para in doc.paragraphs:
                    text += para.text + "\n"
        except Exception as e:
            print(f"Error extracting text from {file_path}: {e}")
            
        return text

    @staticmethod
    def parse_resume(file_path):
        """Parses resume and returns structured data."""
        text = ResumeParser.extract_text(file_path)
        data = {}

        # 1. Try LLM Parsing first
        try:
            from flask import current_app
            from app.services.llm_provider.llm import LLMProvider
            import json

            provider_name = current_app.config.get('LLM_PROVIDER')
            # For Ollama/Local, we might not need an API key, but we check provider_name
            api_key = current_app.config.get('GEMINI_API_KEY') if provider_name == 'gemini' else current_app.config.get('OPENAI_API_KEY')
            
            if provider_name and (api_key or provider_name == 'local_llama') and provider_name != 'disabled':
                print(f"DEBUG: Attempting to parse resume with LLM ({provider_name})...")
                llm = LLMProvider()
                
                prompt = f"""
                You are an expert ATS Resume Parser. Extract the following details from the resume text below and return ONLY a valid JSON object.
                Do not include markdown formatting like ```json ... ```. Just the raw JSON string.
                
                Fields to extract:
                - first_name (string, infer from top of resume)
                - last_name (string)
                - email (string)
                - phone (string)
                - linkedin_url (string, null if not found)
                - portfolio_url (string, null if not found)
                - headline (string, a professional headline e.g. "Senior Java Developer")
                - summary (string, a brief professional summary)
                - skills (list of strings)
                - experience_years (integer, estimate total years of work experience)
                - education (list of objects: { "degree": string, "school": string, "year": string })
                - experience (list of objects: { "title": string, "company": string, "duration": string, "description": string })
                - projects (list of objects: { "title": string, "description": string, "link": string })
                - languages (list of strings)
                
                Resume Text:
                {text[:4000]} 
                """
                # Truncate text to avoid token limits if necessary, though 4000 chars is usually safe for summary
                
                response_text = llm.chat([{'role': 'user', 'content': prompt}])
                
                # Clean up response if it contains markdown code blocks
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[0].strip()
                
                data = json.loads(response_text)
                print("DEBUG: LLM Parsing successful.")
                return data

        except Exception as e:
            print(f"WARNING: LLM Parsing failed ({str(e)}). Falling back to basic parser.")

        # 2. Fallback to Basic Regex/Keyword Parsing
        print("DEBUG: Using basic regex parser.")
        print(f"DEBUG: Extracted text length: {len(text)}")
        print(f"DEBUG: First 500 chars: {text[:500]!r}")
        
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        # Improved Name Extraction Heuristic
        first_name = ""
        last_name = ""
        
        # Iterate through first few lines to find a likely name
        # Skip lines that look like headers or contact info
        for i in range(min(10, len(lines))):
            line = lines[i]
            # Check if line is not a common header or email/phone
            if ResumeParser._is_likely_name(line):
                name_parts = line.split(' ')
                print(f"DEBUG: Potential name found: {line}")
                if len(name_parts) >= 2:
                    first_name = name_parts[0]
                    last_name = " ".join(name_parts[1:])
                    break
                elif len(name_parts) == 1:
                    first_name = name_parts[0]
                    # If single name, maybe look at next line? But standard is full name on one line.
                    break
        
        print(f"DEBUG: Extracted Name: {first_name} {last_name}")

        # Heuristic for experience
        exp_match = re.search(r'(\d+)\+?\s*years?', text, re.IGNORECASE)
        experience_years = int(exp_match.group(1)) if exp_match else 0

        # Extract sections
        sections = ResumeParser._extract_sections(text)
        
        # Parse sections
        education = ResumeParser._parse_education_section(sections.get('education', ''))
        experience = ResumeParser._parse_experience_section(sections.get('experience', ''))
        projects = ResumeParser._parse_projects_section(sections.get('projects', ''))

        data = {
            'text': text,
            'email': ResumeParser._extract_email(text),
            'phone': ResumeParser._extract_phone(text),
            'skills': ResumeParser._extract_skills(text),
            'first_name': first_name,
            'last_name': last_name,
            'experience_years': experience_years,
            'headline': f"{first_name} {last_name} - Resume", # Default headline
            'summary': text[:500] + "...",
            'education': education,
            'experience': experience,
            'projects': projects,
            'languages': []
        }
        return data

    @staticmethod
    def _is_likely_name(line):
        """Check if a line is likely a name (not email, phone, header, or too long)"""
        if len(line.split(' ')) > 5: return False # Names usually aren't sentences
        if '@' in line: return False # Email
        if re.search(r'\d', line): return False # Phone or address usually has digits
        
        keywords = ['resume', 'curriculum', 'vitae', 'cv', 'profile', 'summary', 'education', 'experience', 'skills', 'projects', 'contact']
        if line.lower() in keywords: return False
        
        # Check for capitalization (heuristic: Name usually Title Case or ALL CAPS)
        # But some PDFs extraction might be messy. 
        # Let's assume non-keyword short line at top is name.
        return True

    @staticmethod
    def _extract_sections(text):
        sections = {'education': '', 'experience': '', 'projects': '', 'skills': ''}
        current_section = None
        lines = text.split('\n')
        
        keywords = {
            'education': ['education', 'academic', 'qualifications', 'education history'],
            'experience': ['experience', 'work history', 'employment', 'professional experience', 'work experience'],
            'projects': ['projects', 'personal projects', 'academic projects'],
            'skills': ['skills', 'core skills', 'technical skills', 'technologies', 'competencies']
        }
        
        for line in lines:
            line_clean = line.strip().lower()
            # Check if line is a header (short and contains keyword)
            is_header = False
            if len(line_clean) < 40:
                for section, keys in keywords.items():
                    if any(k == line_clean or k in line_clean for k in keys):
                        current_section = section
                        is_header = True
                        break
            
            if is_header:
                continue
                
            if current_section:
                sections[current_section] += line + "\n"
        
        return sections

    @staticmethod
    def _parse_education_section(text):
        if not text: return []
        entries = []
        # Simple heuristic: Look for degree keywords or institution types
        degrees = ['bachelor', 'master', 'b.tech', 'm.tech', 'phd', 'diploma', 'bsc', 'msc', 'bca', 'mca', 'university', 'college', 'institute', 'school']
        lines = text.split('\n')
        current_entry = {}
        
        for line in lines:
            line_lower = line.lower()
            if any(d in line_lower for d in degrees):
                if current_entry: entries.append(current_entry)
                current_entry = {'degree': line.strip(), 'school': '', 'year': ''}
            elif current_entry:
                # Assume next line is school or year
                if re.search(r'\d{4}', line):
                    current_entry['year'] = line.strip()
                elif not current_entry['school']:
                    current_entry['school'] = line.strip()
        
        if current_entry: entries.append(current_entry)
        
        # If no structure found but text exists, return raw text as one entry
        if not entries and text.strip():
            return [{'degree': 'Education Details', 'school': text[:200], 'year': ''}]
            
        return entries

    @staticmethod
    def _parse_experience_section(text):
        if not text: return []
        entries = []
        # Look for date ranges
        date_pattern = r'((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4})|(\d{4}\s*-\s*(?:present|current|\d{4}))'
        lines = text.split('\n')
        current_entry = {}
        
        for line in lines:
            # Check for pipe separated lines which often contain Role | Company | Date
            if '|' in line:
                parts = [p.strip() for p in line.split('|')]
                # Try to find date in parts
                date_part = next((p for p in parts if re.search(date_pattern, p, re.IGNORECASE)), None)
                if date_part:
                    if current_entry: entries.append(current_entry)
                    # Guess: First part is Role, Second is Company (or vice versa)
                    role = parts[0]
                    company = parts[1] if len(parts) > 1 else ""
                    current_entry = {'title': role, 'company': company, 'duration': date_part, 'description': ''}
                    continue

            if re.search(date_pattern, line, re.IGNORECASE):
                if current_entry: entries.append(current_entry)
                current_entry = {'title': 'Role', 'company': line.strip(), 'duration': '', 'description': ''}
                match = re.search(date_pattern, line, re.IGNORECASE)
                if match:
                    current_entry['duration'] = match.group(0)
            elif current_entry:
                if not current_entry['title'] or current_entry['title'] == 'Role':
                    current_entry['title'] = line.strip()
                else:
                    current_entry['description'] += line.strip() + " "
        
        if current_entry: entries.append(current_entry)
        
        if not entries and text.strip():
            return [{'title': 'Work Experience', 'company': '', 'duration': '', 'description': text[:500]}]
            
        return entries

    @staticmethod
    def _parse_projects_section(text):
        if not text: return []
        return [{'title': 'Project Details', 'description': text[:500], 'link': ''}]

    @staticmethod
    def _extract_email(text):
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, text)
        return match.group(0) if match else None

    @staticmethod
    def _extract_phone(text):
        # Improved phone regex to handle more formats including spaces and 5-5 split
        # Matches: +91 97696 86972, 97696 86972, +1-555-555-5555
        phone_pattern = r'(\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|(\+\d{1,3}[\s.-]?)?\d{5}[\s.-]?\d{5}'
        match = re.search(phone_pattern, text)
        return match.group(0) if match else None

    @staticmethod
    def _extract_skills(text):
        # 1. Try to find a "Skills" section and extract from there
        sections = ResumeParser._extract_sections(text)
        skills_text = sections.get('skills', '') # We need to update _extract_sections to find 'skills'
        
        found_skills = set()
        
        if skills_text:
            # Split by common delimiters
            potential_skills = re.split(r'[,|•\n]', skills_text)
            for s in potential_skills:
                s = s.strip()
                if 2 < len(s) < 30: # Reasonable length for a skill
                    found_skills.add(s)
        
        # 2. Also scan for common keywords in the whole text (fallback/augmentation)
        common_skills = [
            'python', 'java', 'javascript', 'react', 'node', 'sql', 'aws', 'docker', 
            'kubernetes', 'c++', 'c#', 'go', 'rust', 'typescript', 'html', 'css',
            'machine learning', 'ai', 'data science', 'git', 'linux', 'agile',
            'predictive modeling', 'classification', 'clustering', 'tableau', 'power bi'
        ]
        text_lower = text.lower()
        for skill in common_skills:
            if skill in text_lower:
                found_skills.add(skill) # Add proper case if we had a map, but here just lowercase match
                
        return list(found_skills)
