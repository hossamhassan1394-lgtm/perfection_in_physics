from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import pandas as pd
from datetime import datetime
import traceback

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for Angular frontend

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Allowed groups
ALLOWED_GROUPS = ['cam1', 'maimi', 'cam2', 'west', 'station1', 'station2', 'station3']

# Allowed session numbers
ALLOWED_SESSIONS = list(range(1, 9))  # 1 to 8

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def normalize_phone(phone: str) -> str:
    """Normalize phone numbers to local format starting with '01' and 11 digits when possible.
    Examples:
      +201012345678 -> 01012345678
      201012345678 -> 01012345678
      01012345678 -> 01012345678
      1012345678   -> 01012345678
    """
    if not phone:
        return ''

    # Keep only digits
    cleaned = ''.join(ch for ch in phone if ch.isdigit())
    if cleaned.startswith('00'):
        cleaned = cleaned[2:]

    # If it has country code 20 (Egypt), convert to local starting with 0
    if cleaned.startswith('20') and len(cleaned) >= 11:
        candidate = '0' + cleaned[2:]
        if candidate.startswith('01') and len(candidate) == 11:
            return candidate

    # If it's already local 11-digit starting with 01
    if len(cleaned) == 11 and cleaned.startswith('01'):
        return cleaned

    # If it's 10 digits starting with 1 (missing leading zero)
    if len(cleaned) == 10 and cleaned.startswith('1'):
        return '0' + cleaned

    # As a last resort, if cleaned ends with 10 digits starting with '1', use that
    if len(cleaned) > 11 and cleaned[-10].isdigit():
        last10 = cleaned[-10:]
        if last10.startswith('1'):
            return '0' + last10

    return cleaned

def parse_general_exam_sheet(file_path):
    """
    Parse general exam Excel sheet
    Columns: id, name, .Parent No, shamel (a, p), Q
    """
    try:
        # Try reading with header=0 first
        df = pd.read_excel(file_path, header=0)
        
        # Clean column names (remove spaces, handle special characters)
        df.columns = df.columns.astype(str).str.strip()
        
        # Find the actual column names (they might have variations)
        id_col = None
        name_col = None
        parent_col = None
        shamel_a_col = None
        shamel_p_col = None
        q_col = None
        
        # First pass: find main columns
        for col in df.columns:
            col_lower = str(col).lower().strip()
            if 'id' in col_lower and id_col is None and col_lower != 'parent':
                id_col = col
            elif 'name' in col_lower and name_col is None:
                name_col = col
            elif 'parent' in col_lower and parent_col is None:
                parent_col = col
            elif col_lower == 'q' or col_lower.strip() == 'q':
                q_col = col
        
        # Second pass: find shamel columns (a and p)
        # These might be separate columns or under a merged header
        col_list = list(df.columns)
        for i, col in enumerate(col_list):
            col_lower = str(col).lower().strip()
            # Check if this is column 'a' and might be under shamel
            if (col_lower == 'a' or 'a' in col_lower) and shamel_a_col is None:
                # Check previous column for 'shamel' or if it's in a typical position
                if i > 0:
                    prev_col = str(col_list[i-1]).lower()
                    if 'shamel' in prev_col or 'parent' in prev_col:
                        shamel_a_col = col
                else:
                    # If it's after parent column, likely shamel a
                    if parent_col and col_list.index(col) > col_list.index(parent_col):
                        shamel_a_col = col
            
            # Check if this is column 'p' and might be under shamel
            if (col_lower == 'p' or col_lower.strip() == 'p') and shamel_p_col is None and col != shamel_a_col:
                # Check if it's right after shamel_a_col or in typical position
                if shamel_a_col:
                    if col_list.index(col) == col_list.index(shamel_a_col) + 1:
                        shamel_p_col = col
                elif i > 0:
                    prev_col = str(col_list[i-1]).lower()
                    if 'shamel' in prev_col or 'a' in prev_col:
                        shamel_p_col = col
        
        # Fallback: if shamel columns not found, try by position after parent
        if parent_col:
            parent_idx = col_list.index(parent_col)
            # Usually shamel a and p come right after parent
            if parent_idx + 1 < len(col_list) and shamel_a_col is None:
                potential_a = col_list[parent_idx + 1]
                if 'a' in str(potential_a).lower() or str(potential_a).strip() == 'a':
                    shamel_a_col = potential_a
            if parent_idx + 2 < len(col_list) and shamel_p_col is None:
                potential_p = col_list[parent_idx + 2]
                if 'p' in str(potential_p).lower() or str(potential_p).strip() == 'p':
                    shamel_p_col = potential_p
        
        if not all([id_col, name_col, parent_col, q_col]):
            raise ValueError(f"Required columns not found in general exam sheet. Found: {list(df.columns)}")
        
        records = []
        for _, row in df.iterrows():
            # Skip empty rows
            if pd.isna(row[id_col]) or str(row[id_col]).strip() == '':
                continue
            
            try:
                # Handle parent_no conversion
                parent_no_val = row[parent_col]
                if pd.isna(parent_no_val):
                    parent_no_str = ''
                else:
                    # Try to convert to int, but handle if it's already a string
                    try:
                        parent_no_str = str(int(float(parent_no_val)))
                    except:
                        parent_no_str = str(parent_no_val).strip()
                
                record = {
                    'id': str(row[id_col]).strip(),
                    'name': str(row[name_col]).strip() if not pd.isna(row[name_col]) else '',
                    'parent_no': parent_no_str,
                    'attendance': 1 if shamel_a_col and not pd.isna(row[shamel_a_col]) and (row[shamel_a_col] == 1 or str(row[shamel_a_col]).strip() == '1') else 0,
                    'payment': 1 if shamel_p_col and not pd.isna(row[shamel_p_col]) and (row[shamel_p_col] == 1 or str(row[shamel_p_col]).strip() == '1') else 0,
                    'quiz_mark': float(row[q_col]) if not pd.isna(row[q_col]) else None
                }
                records.append(record)
            except Exception as e:
                # Skip rows with errors but continue processing
                print(f"Warning: Error processing row {row.get(id_col, 'unknown')}: {str(e)}")
                continue
        
        return records
    except Exception as e:
        raise Exception(f"Error parsing general exam sheet: {str(e)}")

def parse_normal_lecture_sheet(file_path):
    """
    Parse normal lecture Excel sheet
    Columns: id, name, pokin, student no., Parent No., a, p, Q, time, s1
    """
    try:
        df = pd.read_excel(file_path, header=0)
        
        # Clean column names
        df.columns = df.columns.astype(str).str.strip()
        
        # Find columns
        id_col = None
        name_col = None
        pokin_col = None
        student_no_col = None
        parent_col = None
        a_col = None
        p_col = None
        q_col = None
        time_col = None
        s1_col = None
        
        for col in df.columns:
            col_lower = str(col).lower().strip()
            if 'id' in col_lower and id_col is None and col_lower != 'parent' and 'student' not in col_lower:
                id_col = col
            elif 'name' in col_lower and name_col is None:
                name_col = col
            elif 'pokin' in col_lower and pokin_col is None:
                pokin_col = col
            elif 'student' in col_lower and 'no' in col_lower and student_no_col is None:
                student_no_col = col
            elif 'parent' in col_lower and 'no' in col_lower and parent_col is None:
                parent_col = col
            elif col_lower == 'a' and a_col is None:
                a_col = col
            elif col_lower == 'p' and p_col is None:
                p_col = col
            elif col_lower == 'q' and q_col is None:
                q_col = col
            elif 'time' in col_lower and time_col is None:
                time_col = col
            elif col_lower == 's1' and s1_col is None:
                s1_col = col
        
        if not all([id_col, name_col, parent_col]):
            raise ValueError(f"Required columns not found in normal lecture sheet. Found: {list(df.columns)}")
        
        records = []
        for _, row in df.iterrows():
            if pd.isna(row[id_col]) or str(row[id_col]).strip() == '':
                continue
            
            try:
                # Parse time if available
                start_time = None
                if time_col and not pd.isna(row[time_col]):
                    try:
                        time_val = row[time_col]
                        if isinstance(time_val, datetime):
                            start_time = time_val.strftime('%Y-%m-%d %H:%M:%S')
                        elif isinstance(time_val, pd.Timestamp):
                            start_time = time_val.strftime('%Y-%m-%d %H:%M:%S')
                        else:
                            start_time = str(time_val).strip()
                            # Only set if not empty
                            if not start_time:
                                start_time = None
                    except Exception as time_error:
                        print(f"Warning parsing time for {row[id_col]}: {str(time_error)}")
                        start_time = None
                
                # Handle parent_no conversion (CRITICAL - must not be empty if provided)
                parent_no_val = row[parent_col]
                parent_no_str = ''
                if not pd.isna(parent_no_val) and str(parent_no_val).strip():
                    try:
                        # Try to parse as number first
                        parent_no_str = str(int(float(parent_no_val)))
                    except:
                        parent_no_str = str(parent_no_val).strip()
                
                # Handle student_no conversion
                student_no_str = None
                if student_no_col and not pd.isna(row[student_no_col]) and str(row[student_no_col]).strip():
                    try:
                        student_no_str = str(int(float(row[student_no_col])))
                    except:
                        student_no_str = str(row[student_no_col]).strip()
                
                # Parse pokin
                pokin_val = None
                if pokin_col and not pd.isna(row[pokin_col]):
                    try:
                        pokin_val = float(row[pokin_col])
                    except:
                        pass
                
                # Parse payment
                payment_val = None
                if p_col and not pd.isna(row[p_col]):
                    try:
                        payment_val = float(row[p_col])
                    except:
                        pass
                
                # Parse quiz mark
                quiz_val = None
                if q_col and not pd.isna(row[q_col]):
                    try:
                        quiz_val = float(row[q_col])
                    except:
                        pass
                
                record = {
                    'id': str(row[id_col]).strip(),
                    'name': str(row[name_col]).strip() if not pd.isna(row[name_col]) else '',
                    'pokin': pokin_val,
                    'student_no': student_no_str,
                    'parent_no': parent_no_str,
                    'attendance': 1 if a_col and not pd.isna(row[a_col]) and (row[a_col] == 1 or str(row[a_col]).strip() == '1') else 0,
                    'payment': payment_val,
                    'quiz_mark': quiz_val,
                    'start_time': start_time,
                    'homework_status': 0  # Default to completed
                }
                
                # Parse s1 (homework status)
                # null/empty = completed (0), 1 = no hw, 2 = not completed, 3 = cheated
                if s1_col and not pd.isna(row[s1_col]) and str(row[s1_col]).strip():
                    try:
                        s1_value = int(float(row[s1_col]))
                        record['homework_status'] = s1_value
                    except:
                        record['homework_status'] = 0
                
                records.append(record)
            except Exception as e:
                # Skip rows with errors but continue processing
                print(f"Warning: Error processing row {row.get(id_col, 'unknown')}: {str(e)}")
                continue
        
        return records
    except Exception as e:
        raise Exception(f"Error parsing normal lecture sheet: {str(e)}")

def create_or_update_parent(parent_no, student_name=None):
    """
    Create or update parent account in parents table
    Default password is '123456' and needs_password_reset is True
    """
    if not parent_no or parent_no.strip() == '':
        return

    parent_no_norm = normalize_phone(parent_no)
    
    try:
        # Check if parent exists
        existing = supabase.table('parents').select('*').eq('phone_number', parent_no_norm).execute()
        
        if existing.data and len(existing.data) > 0:
            # Parent exists, no need to update
            return
        else:
            # Create new parent account
            parent_data = {
                'phone_number': parent_no_norm,
                'password_hash': '123456',  # Default password (in production, hash this)
                'needs_password_reset': True,
                'name': student_name or f'Parent {parent_no_norm}'
            }
            supabase.table('parents').insert(parent_data).execute()
    except Exception as e:
        # Silently fail parent creation - don't block the main upload
        print(f"Warning: Could not create parent account for {parent_no}: {str(e)}")

def update_database(records, session_number, quiz_mark, finish_time, group, is_general_exam, lecture_name='', exam_name='', has_exam_grade=True, has_payment=True, has_time=True):
    """
    Update database with parsed records - Insert ALL records without validation
    """
    try:
        updated_count = 0
        errors = []
        
        for record in records:
            try:
                student_id = record.get('id', '').strip()
                student_name = record.get('name', '').strip() or 'Unknown'
                parent_no_raw = record.get('parent_no', '') or ''
                parent_no = normalize_phone(parent_no_raw) or ''
                
                # Prepare data for database
                db_data = {
                    'student_id': student_id or f'student_{updated_count}',
                    'student_name': student_name,
                    'parent_no': parent_no,
                    'session_number': session_number,
                    'group_name': group,
                    'is_general_exam': is_general_exam,
                    'attendance': int(record.get('attendance', 0)) if record.get('attendance') else 0,
                    'payment': float(record.get('payment', 0)) if record.get('payment') else 0,
                }
                
                # Add lecture/exam name
                if is_general_exam and exam_name:
                    db_data['exam_name'] = exam_name
                elif not is_general_exam and lecture_name:
                    db_data['lecture_name'] = lecture_name
                
                # Add admin quiz mark
                if quiz_mark is not None:
                    db_data['admin_quiz_mark'] = float(quiz_mark)
                
                # Add optional fields
                if record.get('quiz_mark'):
                    db_data['quiz_mark'] = float(record.get('quiz_mark'))
                
                if finish_time:
                    db_data['finish_time'] = finish_time
                
                if record.get('start_time'):
                    db_data['start_time'] = record.get('start_time')
                
                if record.get('homework_status') is not None:
                    db_data['homework_status'] = int(record.get('homework_status'))
                
                if record.get('pokin'):
                    db_data['pokin'] = float(record.get('pokin'))
                
                if record.get('student_no'):
                    db_data['student_no'] = str(record.get('student_no')).strip()
                
                # Insert record - no validation, just insert everything
                supabase.table('session_records').insert(db_data).execute()
                updated_count += 1
                    
            except Exception as e:
                errors.append(str(e))
        
        print(f"✅ Uploaded {updated_count}/{len(records)} records")
        return updated_count, errors
    except Exception as e:
        raise Exception(f"Error updating database: {str(e)}")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Flask backend is running'}), 200

@app.route('/api/upload-excel', methods=['POST'])
def upload_excel():
    """
    Upload and process Excel file
    Expected form data:
    - file: Excel file
    - session_number: 1-8
    - quiz_mark: number (for general exam)
    - finish_time: datetime string
    - group: cam1, maimi, cam2, west, station1, station2, station3
    - is_general_exam: true/false
    - lecture_name: string (for normal lectures)
    - exam_name: string (for general exams)
    - has_exam_grade: true/false (show exam grade in parent dashboard)
    - has_payment: true/false (show payment in parent dashboard)
    - has_time: true/false (show finish time in parent dashboard)
    """
    try:
        # Validate required fields
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only .xlsx and .xls files are allowed'}), 400
        
        # Get form data
        session_number = request.form.get('session_number')
        quiz_mark = request.form.get('quiz_mark')
        finish_time = request.form.get('finish_time')
        group = request.form.get('group')
        is_general_exam = request.form.get('is_general_exam', 'false').lower() == 'true'
        lecture_name = request.form.get('lecture_name', '').strip()
        exam_name = request.form.get('exam_name', '').strip()
        has_exam_grade = request.form.get('has_exam_grade', 'true').lower() == 'true'
        has_payment = request.form.get('has_payment', 'true').lower() == 'true'
        has_time = request.form.get('has_time', 'true').lower() == 'true'
        
        # Validate session number
        try:
            session_number = int(session_number)
            if session_number not in ALLOWED_SESSIONS:
                return jsonify({'error': f'Session number must be between 1 and 8'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid session number'}), 400
        
        # Validate quiz mark (required for general exam)
        if is_general_exam:
            try:
                quiz_mark = float(quiz_mark) if quiz_mark else None
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid quiz mark'}), 400
        else:
            quiz_mark = float(quiz_mark) if quiz_mark else None
        
        # Validate group
        if not group or group not in ALLOWED_GROUPS:
            return jsonify({'error': f'Invalid group. Must be one of: {", ".join(ALLOWED_GROUPS)}'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            # Parse Excel file based on type
            if is_general_exam:
                records = parse_general_exam_sheet(file_path)
            else:
                records = parse_normal_lecture_sheet(file_path)
            
            if not records:
                return jsonify({'error': 'No records found in Excel file'}), 400
            
            # Update database
            updated_count, errors = update_database(
                records, 
                session_number, 
                quiz_mark, 
                finish_time, 
                group, 
                is_general_exam,
                lecture_name,
                exam_name,
                has_exam_grade,
                has_payment,
                has_time
            )
            
            # Clean up uploaded file
            os.remove(file_path)
            
            response = {
                'success': True,
                'message': f'Successfully processed {updated_count} records',
                'updated_count': updated_count,
                'total_records': len(records)
            }
            
            if errors:
                response['errors'] = errors
                response['error_count'] = len(errors)
            
            return jsonify(response), 200
            
        except Exception as e:
            # Clean up file on error
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': f'Error processing file: {str(e)}', 'traceback': traceback.format_exc()}), 500
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}', 'traceback': traceback.format_exc()}), 500

@app.route('/api/groups', methods=['GET'])
def get_groups():
    """Get list of available groups"""
    return jsonify({'groups': ALLOWED_GROUPS}), 200

@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    """Get list of available session numbers"""
    return jsonify({'sessions': ALLOWED_SESSIONS}), 200


@app.route('/api/parent/students', methods=['GET'])
def get_parent_students():
    """Return aggregated student list for a parent identified by phone_number="""
    phone = request.args.get('phone_number')
    if not phone:
        return jsonify({'error': 'phone_number query parameter required'}), 400
    phone = normalize_phone(phone)

    try:
        # Fetch all session records for this parent
        result = supabase.table('session_records').select('*').eq('parent_no', phone).execute()
        records = result.data or []

        # Aggregate by student_id
        students_map = {}
        for r in records:
            sid = r.get('student_id')
            if not sid:
                continue
            entry = students_map.setdefault(sid, {
                'id': sid,
                'name': r.get('student_name') or '',
                'grade': '',
                'attendance_count': 0,
                'records_count': 0,
                'payments_sum': 0.0,
                'quiz_sum': 0.0,
                'quiz_count': 0
            })

            entry['records_count'] += 1
            try:
                entry['attendance_count'] += int(r.get('attendance') or 0)
            except:
                pass
            try:
                entry['payments_sum'] += float(r.get('payment') or 0)
            except:
                pass
            try:
                if r.get('quiz_mark') is not None:
                    entry['quiz_sum'] += float(r.get('quiz_mark'))
                    entry['quiz_count'] += 1
            except:
                pass

        students = []
        for sid, v in students_map.items():
            attendance_pct = 0
            if v['records_count'] > 0:
                attendance_pct = round((v['attendance_count'] / v['records_count']) * 100)

            # Assume per-session expected payment 140 if no better info
            total_expected = v['records_count'] * 140
            quizzes_avg = round((v['quiz_sum'] / v['quiz_count']), 2) if v['quiz_count'] > 0 else 0

            students.append({
                'id': v['id'],
                'name': v['name'],
                'grade': v.get('grade', ''),
                'attendance': attendance_pct,
                'payments': { 'paid': v['payments_sum'], 'total': total_expected },
                'quizzes': { 'average': quizzes_avg, 'total': v['quiz_count'] }
            })

        return jsonify({'students': students}), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching students: {str(e)}', 'traceback': traceback.format_exc()}), 500


@app.route('/api/parent/sessions', methods=['GET'])
def get_parent_sessions():
    """Return session records for a parent and optional student_id query param
    Filters fields based on has_exam_grade, has_payment, and has_time flags"""
    phone = request.args.get('phone_number')
    student_id = request.args.get('student_id')
    if not phone:
        return jsonify({'error': 'phone_number query parameter required'}), 400
    phone = normalize_phone(phone)

    try:
        query = supabase.table('session_records').select('*').eq('parent_no', phone)
        if student_id:
            query = query.eq('student_id', student_id)

        result = query.execute()
        records = result.data or []

        sessions = []
        for r in records:
            # Check which fields should be displayed based on admin flags
            has_exam_grade = r.get('has_exam_grade', True)
            has_payment = r.get('has_payment', True)
            has_time = r.get('has_time', True)
            
            # Build session object, filtering based on admin flags
            session = {
                'id': r.get('id') or r.get('student_no') or r.get('student_id'),
                'chapter': r.get('session_number'),
                'name': r.get('lecture_name') or r.get('exam_name') or r.get('student_name') or f"Session {r.get('session_number')}",
                'lectureName': r.get('lecture_name') or r.get('exam_name'),
                'date': r.get('finish_time') or '',
                'startTime': r.get('start_time') or '',
                'start_time': r.get('start_time') or '',
                'attendance': 'attended' if int(r.get('attendance') or 0) == 1 else 'missed',
                'homeworkStatus': 'completed' if (r.get('homework_status') in (0, None)) else 'pending'
            }
            
            # Conditionally add quiz mark only if has_exam_grade is true
            if has_exam_grade:
                session['quizCorrect'] = int(r.get('quiz_mark') or 0)
                session['quizTotal'] = 15
                # Add admin quiz mark if available
                if r.get('admin_quiz_mark'):
                    session['adminQuizMark'] = int(r.get('admin_quiz_mark') or 15)
            
            # Conditionally add payment only if has_payment is true
            if has_payment:
                session['payment'] = float(r.get('payment') or 0)
            
            # Conditionally add finish time only if has_time is true
            if has_time:
                session['endTime'] = r.get('finish_time') or ''
            
            sessions.append(session)

        # Sort by chapter/session_number descending
        sessions = sorted(sessions, key=lambda s: s.get('chapter') or 0, reverse=True)

        return jsonify({'sessions': sessions}), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching sessions: {str(e)}', 'traceback': traceback.format_exc()}), 500


@app.route('/api/students', methods=['GET'])
def get_all_students():
    """Return aggregated student list across all parents (for admin)"""
    try:
        result = supabase.table('session_records').select('*').execute()
        records = result.data or []

        students_map = {}
        for r in records:
            sid = r.get('student_id')
            if not sid:
                continue
            entry = students_map.setdefault(sid, {
                'id': sid,
                'name': r.get('student_name') or '',
                'grade': '',
                'attendance_count': 0,
                'records_count': 0,
                'payments_sum': 0.0,
                'quiz_sum': 0.0,
                'quiz_count': 0
            })

            entry['records_count'] += 1
            try:
                entry['attendance_count'] += int(r.get('attendance') or 0)
            except:
                pass
            try:
                entry['payments_sum'] += float(r.get('payment') or 0)
            except:
                pass
            try:
                if r.get('quiz_mark') is not None:
                    entry['quiz_sum'] += float(r.get('quiz_mark'))
                    entry['quiz_count'] += 1
            except:
                pass

        students = []
        for sid, v in students_map.items():
            attendance_pct = 0
            if v['records_count'] > 0:
                attendance_pct = round((v['attendance_count'] / v['records_count']) * 100)

            total_expected = v['records_count'] * 140
            quizzes_avg = round((v['quiz_sum'] / v['quiz_count']), 2) if v['quiz_count'] > 0 else 0

            students.append({
                'id': v['id'],
                'name': v['name'],
                'grade': v.get('grade', ''),
                'attendance': attendance_pct,
                'payments': { 'paid': v['payments_sum'], 'total': total_expected },
                'quizzes': { 'average': quizzes_avg, 'total': v['quiz_count'] }
            })

        return jsonify({'students': students}), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching all students: {str(e)}', 'traceback': traceback.format_exc()}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """
    Parent login endpoint
    Expected JSON:
    {
        "phone_number": "01234567890",
        "password": "123456"
    }
    """
    try:
        data = request.get_json()
        phone_number = data.get('phone_number', '').strip()
        password = data.get('password', '').strip()
        
        if not phone_number or not password:
            return jsonify({'success': False, 'message': 'Phone number and password are required'}), 400
        
        # Normalize phone and find parent by phone number
        phone_number = normalize_phone(phone_number)
        result = supabase.table('parents').select('*').eq('phone_number', phone_number).execute()
        
        if not result.data or len(result.data) == 0:
            # Parent doesn't exist, create a new one with default password
            print(f"📝 Creating new parent account for {phone_number}")
            try:
                parent_data = {
                    'phone_number': phone_number,
                    'password_hash': password,
                    'needs_password_reset': True,
                    'name': f'Parent {phone_number}'
                }
                create_result = supabase.table('parents').insert(parent_data).execute()
                if create_result and create_result.data:
                    parent = create_result.data[0]
                    print(f"✓ Parent account created for {phone_number}")
                else:
                    return jsonify({'success': False, 'message': 'Failed to create parent account'}), 500
            except Exception as create_error:
                print(f"❌ Error creating parent: {str(create_error)}")
                return jsonify({'success': False, 'message': f'Error creating account: {str(create_error)}'}), 500
        else:
            parent = result.data[0]
            
            # Check password (in production, use proper password hashing)
            if parent['password_hash'] != password:
                return jsonify({'success': False, 'message': 'Invalid phone number or password'}), 401
        
        # Update last login
        try:
            supabase.table('parents').update({'last_login': datetime.now().isoformat()}).eq('phone_number', phone_number).execute()
        except:
            pass  # Don't fail login if update fails
        
        # Return user data
        return jsonify({
            'success': True,
            'user': {
                'phone_number': parent['phone_number'],
                'name': parent.get('name', ''),
                'needs_password_reset': parent.get('needs_password_reset', True)
            },
            'needs_password_reset': parent.get('needs_password_reset', True)
        }), 200
        
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return jsonify({'success': False, 'message': f'Login error: {str(e)}'}), 500


@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """
    Reset password for first-time login.
    Expected JSON:
    {
        "phone_number": "01234567890",
        "new_password": "newpassword123"
    }
    """
    try:
        data = request.get_json() or {}
        phone_number = (data.get('phone_number') or '').strip()
        new_password = (data.get('new_password') or '').strip()

        if not phone_number or not new_password:
            return jsonify({'success': False, 'message': 'Phone number and new password are required'}), 400

        if len(new_password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters long'}), 400

        phone_number = normalize_phone(phone_number)

        # Find parent
        result = supabase.table('parents').select('*').eq('phone_number', phone_number).execute()
        if not result.data or len(result.data) == 0:
            return jsonify({'success': False, 'message': 'Parent not found'}), 404

        try:
            update_result = supabase.table('parents').update({
                'password_hash': new_password,
                'needs_password_reset': False
            }).eq('phone_number', phone_number).execute()

            if update_result and update_result.data:
                return jsonify({'success': True, 'message': 'Password updated successfully'}), 200
            else:
                return jsonify({'success': False, 'message': 'Failed to update password'}), 500
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error updating password: {str(e)}'}), 500

    except Exception as e:
        return jsonify({'success': False, 'message': f'Reset password error: {str(e)}'}), 500

@app.route('/api/auth/change-password', methods=['POST'])
def change_password():
    """
    Change password endpoint for parents
    Expected JSON:
    {
        "phone_number": "01234567890",
        "current_password": "oldpassword",
        "new_password": "newpassword123"
    }
    """
    try:
        data = request.get_json()
        phone_number = data.get('phone_number', '').strip()
        current_password = data.get('current_password', '').strip()
        new_password = data.get('new_password', '').strip()
        
        if not phone_number or not current_password or not new_password:
            return jsonify({'success': False, 'message': 'Phone number, current password, and new password are required'}), 400
        
        if len(new_password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters long'}), 400
        
        # Normalize phone and find parent
        phone_number = normalize_phone(phone_number)
        result = supabase.table('parents').select('*').eq('phone_number', phone_number).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify({'success': False, 'message': 'Parent not found'}), 404
        
        parent = result.data[0]
        
        # Check if password_hash column exists and has a value
        if 'password_hash' not in parent or not parent['password_hash']:
            # For new parents without password set, allow setting one without verification
            stored_password = parent.get('password') or parent.get('password_hash')
        else:
            stored_password = parent.get('password_hash')
        
        # Verify current password (in production, use proper password hashing)
        if stored_password and stored_password != current_password:
            return jsonify({'success': False, 'message': 'Current password is incorrect'}), 401
        
        # Update to new password - try password_hash first, then password
        try:
            # First, try to update with password_hash column
            try:
                update_result = supabase.table('parents').update({
                    'password_hash': new_password
                }).eq('phone_number', phone_number).execute()
                
                # Check if update actually worked by verifying the data was updated
                if update_result and update_result.data:
                    return jsonify({
                        'success': True,
                        'message': 'Password changed successfully'
                    }), 200
            except Exception as hash_error:
                # If password_hash fails, try password column instead
                print(f"password_hash update failed, trying password column: {str(hash_error)}")
                try:
                    update_result = supabase.table('parents').update({
                        'password': new_password
                    }).eq('phone_number', phone_number).execute()
                    
                    if update_result and update_result.data:
                        return jsonify({
                            'success': True,
                            'message': 'Password changed successfully'
                        }), 200
                except Exception as password_error:
                    print(f"password update failed: {str(password_error)}")
                    raise password_error
            
            # If we get here, something went wrong
            return jsonify({
                'success': False,
                'message': 'Failed to update password in database'
            }), 500
        except Exception as update_error:
            error_msg = str(update_error)
            print(f"Database update error: {error_msg}")
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'message': f'Database error: {error_msg}'}), 500
        
    except Exception as e:
        print(f"Change password error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': f'Error changing password: {str(e)}'}), 500
        
        # Update password (in production, hash the password)
        supabase.table('parents').update({
            'password_hash': new_password,
            'needs_password_reset': False
        }).eq('phone_number', phone_number).execute()
        
        return jsonify({
            'success': True,
            'message': 'Password updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error updating password: {str(e)}'}), 500


@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Admin login endpoint. Expects JSON: { username, password }"""
    try:
        data = request.get_json() or {}
        username = (data.get('username') or '').strip()
        password = (data.get('password') or '').strip()

        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400

        # Try admins table first
        try:
            result = supabase.table('admins').select('*').eq('username', username).execute()
            if result.data and len(result.data) > 0:
                admin = result.data[0]
                if admin.get('password_hash') == password:
                    return jsonify({'success': True, 'user': {'username': admin.get('username'), 'name': admin.get('name', '')}}), 200
                else:
                    return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
        except Exception:
            # If admins table does not exist or query fails, fallthrough to default
            pass

        # Fallback: no admin record found
        return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': f'Admin login error: {str(e)}'}), 500


@app.route('/api/admin/change-password', methods=['POST'])
def admin_change_password():
    """Admin change password. Expects JSON: { username, current_password, new_password }"""
    try:
        data = request.get_json() or {}
        username = (data.get('username') or '').strip()
        current_password = (data.get('current_password') or '').strip()
        new_password = (data.get('new_password') or '').strip()

        if not username or not current_password or not new_password:
            return jsonify({'success': False, 'message': 'Username, current password, and new password are required'}), 400

        if len(new_password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters long'}), 400

        # Find admin user
        try:
            result = supabase.table('admins').select('*').eq('username', username).execute()
            if not result.data or len(result.data) == 0:
                return jsonify({'success': False, 'message': 'Admin user not found'}), 404

            admin = result.data[0]
            
            # Check if password_hash column exists and has a value
            if 'password_hash' not in admin or not admin['password_hash']:
                # For new admins without password set, allow setting one without verification
                stored_password = admin.get('password') or admin.get('password_hash')
            else:
                stored_password = admin.get('password_hash')
            
            # Verify current password (in production, use proper password hashing)
            if stored_password and stored_password != current_password:
                return jsonify({'success': False, 'message': 'Current password is incorrect'}), 401
            
            # Update password - try password_hash first, then password
            try:
                # First, try to update with password_hash column
                try:
                    update_result = supabase.table('admins').update({'password_hash': new_password}).eq('username', username).execute()
                    
                    if update_result and update_result.data:
                        return jsonify({'success': True, 'message': 'Password changed successfully'}), 200
                except Exception as hash_error:
                    # If password_hash fails, try password column instead
                    print(f"Admin password_hash update failed, trying password column: {str(hash_error)}")
                    try:
                        update_result = supabase.table('admins').update({'password': new_password}).eq('username', username).execute()
                        
                        if update_result and update_result.data:
                            return jsonify({'success': True, 'message': 'Password changed successfully'}), 200
                    except Exception as password_error:
                        print(f"Admin password update failed: {str(password_error)}")
                        raise password_error
                
                # If we get here, something went wrong
                return jsonify({
                    'success': False,
                    'message': 'Failed to update password in database'
                }), 500
            except Exception as update_error:
                error_msg = str(update_error)
                print(f"Admin password update error: {error_msg}")
                import traceback
                traceback.print_exc()
                return jsonify({'success': False, 'message': f'Database error: {error_msg}'}), 500
        except Exception as e:
            print(f"Admin change password error: {str(e)}")
            print(traceback.format_exc())
            return jsonify({'success': False, 'message': f'Error changing admin password: {str(e)}'}), 500
    except Exception as e:
        print(f"Admin change password outer error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': f'Admin change password error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

