import os
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate # Import Migrate
from datetime import datetime, timezone, date # Import date

# --- 기본 설정 ---
app = Flask(__name__)
# CORS 설정 확장 - 모든 원본에서의 모든 헤더와 메소드 허용
CORS(app, resources={r"/api/*": {"origins": "*", "supports_credentials": True, "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": "*"}})

# 실제 배포 시에는 특정 도메인만 허용하도록 설정: CORS(app, resources={r"/api/*": {"origins": "http://your-frontend-domain.com"}})

# 데이터베이스 설정 (SQLite 사용)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'reservations.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # SQLAlchemy 이벤트 시스템 비활성화 (성능 향상)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# --- 데이터베이스 모델 정의 ---

class Equipment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(200), nullable=True)
    reservations = db.relationship('Reservation', backref='equipment', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    # email = db.Column(db.String(120), unique=True, nullable=True) # 필요시 추가
    reservations = db.relationship('Reservation', backref='user', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

class Reservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=False)
    # Use start_date and end_date for multi-day reservations
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False) # Inclusive end date
    purpose = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc)) # Keep created_at as DateTime

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None, # 관련된 사용자 이름 포함
            'equipment_id': self.equipment_id,
            'equipment_name': self.equipment.name if self.equipment else None, # 관련된 장비 이름 포함
            # Return dates in ISO format (YYYY-MM-DD)
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'purpose': self.purpose,
            'created_at': self.created_at.isoformat() # Keep created_at as DateTime ISO string
        }

# 정적 파일 제공 루트 (클라이언트에서 직접 액세스 가능)
@app.route('/')
def index():
    return send_from_directory(os.getcwd(), 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(os.getcwd(), path)

# --- API 엔드포인트 (라우트) 정의 ---

# 테스트용 루트 추가
@app.route('/api/test', methods=['GET'])
def test_api():
    """테스트용 API 엔드포인트"""
    return jsonify({
        'status': 'success',
        'message': 'API server is running',
        'timestamp': datetime.now().isoformat()
    })

# == 장비 관리 ==
@app.route('/api/equipment', methods=['GET'])
def get_equipment_list():
    """모든 장비 목록 반환"""
    equipments = Equipment.query.all()
    return jsonify([eq.to_dict() for eq in equipments])

@app.route('/api/equipment', methods=['POST'])
def add_equipment():
    """새 장비 추가"""
    data = request.get_json()
    if not data or not 'name' in data:
        return jsonify({'message': '장비 이름(name)은 필수입니다.'}), 400

    if Equipment.query.filter_by(name=data['name']).first():
        return jsonify({'message': '이미 존재하는 장비 이름입니다.'}), 409 # Conflict

    new_equipment = Equipment(name=data['name'], description=data.get('description'))
    db.session.add(new_equipment)
    try:
        db.session.commit()
        return jsonify(new_equipment.to_dict()), 201 # Created
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': '장비 추가 중 오류 발생', 'error': str(e)}), 500

@app.route('/api/equipment/<int:id>', methods=['DELETE'])
def delete_equipment(id):
    """특정 장비 삭제 (연관된 예약도 함께 삭제됨 - cascade 설정)"""
    equipment = Equipment.query.get(id)
    if equipment is None:
        return jsonify({'message': '해당 ID의 장비를 찾을 수 없습니다.'}), 404 # Not Found

    # # 만약 예약이 있는 장비 삭제를 막고 싶다면 아래 주석 해제
    # if equipment.reservations:
    #    return jsonify({'message': '해당 장비에 예약이 존재하여 삭제할 수 없습니다.'}), 409 # Conflict

    db.session.delete(equipment)
    try:
        db.session.commit()
        return jsonify({'message': f'장비 ID {id} 삭제 완료'}), 200 # OK (또는 204 No Content)
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': '장비 삭제 중 오류 발생', 'error': str(e)}), 500


# == 사용자 관리 ==
@app.route('/api/users', methods=['GET'])
def get_user_list():
    """모든 사용자 목록 반환"""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@app.route('/api/users', methods=['POST'])
def add_user():
    """새 사용자 추가"""
    data = request.get_json()
    if not data or not 'name' in data:
        return jsonify({'message': '사용자 이름(name)은 필수입니다.'}), 400

    if User.query.filter_by(name=data['name']).first():
        return jsonify({'message': '이미 존재하는 사용자 이름입니다.'}), 409

    new_user = User(name=data['name'])
    db.session.add(new_user)
    try:
        db.session.commit()
        return jsonify(new_user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': '사용자 추가 중 오류 발생', 'error': str(e)}), 500

@app.route('/api/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    """특정 사용자 삭제 (연관된 예약도 함께 삭제됨 - cascade 설정)"""
    user = User.query.get(id)
    if user is None:
        return jsonify({'message': '해당 ID의 사용자를 찾을 수 없습니다.'}), 404

    # # 만약 예약이 있는 사용자 삭제를 막고 싶다면 아래 주석 해제
    # if user.reservations:
    #     return jsonify({'message': '해당 사용자에게 예약이 존재하여 삭제할 수 없습니다.'}), 409

    db.session.delete(user)
    try:
        db.session.commit()
        return jsonify({'message': f'사용자 ID {id} 삭제 완료'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': '사용자 삭제 중 오류 발생', 'error': str(e)}), 500


# == 예약 관리 ==
@app.route('/api/reservations', methods=['GET'])
def get_reservations():
    """
    예약 목록 조회 (필터링 가능)
    Query Parameters:
    - start (ISO format, e.g., 2023-10-27): 조회 시작 날짜 (for FullCalendar's view range)
    - end (ISO format, e.g., 2023-11-28): 조회 종료 날짜 (exclusive, for FullCalendar's view range)
    - equipment_id (integer): 특정 장비 ID
    - user_id (integer): 특정 사용자 ID
    """
    query = Reservation.query

    # 날짜 필터링 (start와 end 사이에 있는 예약을 찾음)
    start_str = request.args.get('start')
    end_str = request.args.get('end')
    if start_str and end_str:
        try:
            # Parse date strings (YYYY-MM-DD)
            # Parse date strings from FullCalendar (start is inclusive, end is exclusive)
            view_start_date = date.fromisoformat(start_str)
            view_end_date = date.fromisoformat(end_str)
            print(f"Received view date range: {view_start_date} to {view_end_date}")
            # Find reservations that *overlap* with the view range
            # Overlap condition: (res_start < view_end) and (res_end >= view_start)
            # Note: res_end is inclusive in DB, view_end is exclusive from FullCalendar
            query = query.filter(Reservation.start_date < view_end_date, Reservation.end_date >= view_start_date)
        except ValueError:
            return jsonify({'message': '날짜 형식이 잘못되었습니다. YYYY-MM-DD 형식을 사용해주세요.'}), 400

    # 장비 필터링
    equipment_id = request.args.get('equipment_id')
    if equipment_id:
        try:
            query = query.filter(Reservation.equipment_id == int(equipment_id))
        except ValueError:
             return jsonify({'message': 'equipment_id는 정수여야 합니다.'}), 400

    # 사용자 필터링
    user_id = request.args.get('user_id')
    if user_id:
        try:
            query = query.filter(Reservation.user_id == int(user_id))
        except ValueError:
            return jsonify({'message': 'user_id는 정수여야 합니다.'}), 400

    reservations = query.order_by(Reservation.start_date).all() # Order by start date
    return jsonify([res.to_dict() for res in reservations])

@app.route('/api/reservations', methods=['POST'])
def add_reservation():
    """새 예약 추가 (날짜 범위 중복 검사 포함)"""
    data = request.get_json()
    # Required fields for date range reservation
    required_fields = ['user_id', 'equipment_id', 'start_date', 'end_date']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'message': f'필수 필드가 누락되었습니다: {required_fields}'}), 400

    try:
        user_id = int(data['user_id'])
        equipment_id = int(data['equipment_id'])
        # Parse date strings (YYYY-MM-DD)
        start_date = date.fromisoformat(data['start_date'])
        end_date = date.fromisoformat(data['end_date']) # Inclusive end date
        print(f"Adding reservation from {start_date} to {end_date}")
        purpose = data.get('purpose')
    except (ValueError, TypeError) as e:
        return jsonify({'message': '입력 데이터 형식이 잘못되었습니다. 날짜는 YYYY-MM-DD 형식이어야 합니다.', 'error': str(e)}), 400

    # 날짜 유효성 검사
    if start_date > end_date:
        return jsonify({'message': '시작 날짜는 종료 날짜보다 빠르거나 같아야 합니다.'}), 400
    if start_date < date.today():
         return jsonify({'message': '과거 날짜로 예약할 수 없습니다.'}), 400 # 선택사항

    # 사용자 및 장비 존재 여부 확인
    if not User.query.get(user_id):
        return jsonify({'message': f'사용자 ID {user_id}를 찾을 수 없습니다.'}), 404
    if not Equipment.query.get(equipment_id):
        return jsonify({'message': f'장비 ID {equipment_id}를 찾을 수 없습니다.'}), 404

    # 날짜 범위 중복 검사 (같은 장비에 대해 겹치는 예약이 있는지 확인)
    # Overlap condition: (new_start <= existing_end) and (new_end >= existing_start)
    overlapping_reservations = Reservation.query.filter(
        Reservation.equipment_id == equipment_id,
        Reservation.start_date <= end_date,
        Reservation.end_date >= start_date
    ).first() # 하나라도 있으면 중복

    if overlapping_reservations:
        return jsonify({
            'message': '선택한 시간에 해당 장비의 예약이 이미 존재합니다.',
            'conflict_reservation': overlapping_reservations.to_dict() # 어떤 예약과 충돌하는지 정보 제공 (선택사항)
        }), 409 # Conflict

    # 예약 생성
    new_reservation = Reservation(
        user_id=user_id,
        equipment_id=equipment_id,
        start_date=start_date,
        end_date=end_date,
        purpose=purpose
    )
    db.session.add(new_reservation)
    try:
        db.session.commit()
        return jsonify(new_reservation.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        # 예외 메시지를 더 자세히 로깅하고, 클라이언트에게 반환
        error_message = str(e.__cause__ or e)
        print(f"예약 추가 중 오류 발생: {error_message}")
        return jsonify({'message': '예약 추가 중 오류 발생', 'error': error_message}), 500

@app.route('/api/reservations/<int:id>', methods=['PUT'])
def update_reservation(id):
    """특정 예약 수정 (날짜 범위 중복 검사 포함)"""
    reservation = Reservation.query.get(id)
    if reservation is None:
        return jsonify({'message': '해당 ID의 예약을 찾을 수 없습니다.'}), 404

    data = request.get_json()
    # Required fields for date range
    required_fields = ['user_id', 'equipment_id', 'start_date', 'end_date']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'message': f'필수 필드가 누락되었습니다: {required_fields}'}), 400

    try:
        user_id = int(data['user_id'])
        equipment_id = int(data['equipment_id'])
        # Parse date strings
        start_date = date.fromisoformat(data['start_date'])
        end_date = date.fromisoformat(data['end_date'])
        print(f"Updating reservation from {start_date} to {end_date}")
        purpose = data.get('purpose')
    except (ValueError, TypeError) as e:
        return jsonify({'message': '입력 데이터 형식이 잘못되었습니다. 날짜는 YYYY-MM-DD 형식이어야 합니다.', 'error': str(e)}), 400

    # 날짜 유효성 검사
    if start_date > end_date:
        return jsonify({'message': '시작 날짜는 종료 날짜보다 빠르거나 같아야 합니다.'}), 400
    if start_date < date.today():
         return jsonify({'message': '과거 날짜로 예약할 수 없습니다.'}), 400 # 선택사항

    # 사용자 및 장비 존재 여부 확인
    if not User.query.get(user_id):
        return jsonify({'message': f'사용자 ID {user_id}를 찾을 수 없습니다.'}), 404
    if not Equipment.query.get(equipment_id):
        return jsonify({'message': f'장비 ID {equipment_id}를 찾을 수 없습니다.'}), 404

    # 날짜 범위 중복 검사 (같은 장비에 대해 겹치는 다른 예약이 있는지 확인)
    # Overlap condition: (new_start <= existing_end) and (new_end >= existing_start)
    overlapping_reservations = Reservation.query.filter(
        Reservation.equipment_id == equipment_id,
        Reservation.id != id,  # 현재 수정 중인 예약은 제외
        Reservation.start_date <= end_date,
        Reservation.end_date >= start_date
    ).first()

    if overlapping_reservations:
        return jsonify({
            'message': '선택한 시간에 해당 장비의 예약이 이미 존재합니다.',
            'conflict_reservation': overlapping_reservations.to_dict()
        }), 409

    # 예약 수정
    reservation.user_id = user_id
    reservation.equipment_id = equipment_id
    reservation.start_date = start_date
    reservation.end_date = end_date
    reservation.purpose = purpose

    try:
        db.session.commit()
        return jsonify(reservation.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': '예약 수정 중 오류 발생', 'error': str(e)}), 500

@app.route('/api/reservations/<int:id>', methods=['DELETE'])
def delete_reservation(id):
    """특정 예약 삭제"""
    reservation = Reservation.query.get(id)
    if reservation is None:
        return jsonify({'message': '해당 ID의 예약을 찾을 수 없습니다.'}), 404

    db.session.delete(reservation)
    try:
        db.session.commit()
        return jsonify({'message': f'예약 ID {id} 삭제 완료'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': '예약 삭제 중 오류 발생', 'error': str(e)}), 500

# == 통계 엔드포인트 ==
@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """
    예약 통계 조회
    Query Parameters:
    - start_date (ISO format, e.g., 2023-10-27): 조회 시작 날짜 (inclusive)
    - end_date (ISO format, e.g., 2023-11-28): 조회 종료 날짜 (inclusive)
    - equipment_id (integer): 특정 장비 ID
    - user_id (integer): 특정 사용자 ID
    """
    query = Reservation.query

    # 날짜 필터링
    start_str = request.args.get('start_date')
    end_str = request.args.get('end_date')
    start_date = None
    end_date = None

    if start_str:
        try:
            start_date = date.fromisoformat(start_str)
            query = query.filter(Reservation.end_date >= start_date)
        except ValueError:
            return jsonify({'message': 'start_date 형식이 잘못되었습니다. YYYY-MM-DD 형식을 사용해주세요.'}), 400

    if end_str:
        try:
            end_date = date.fromisoformat(end_str)
            query = query.filter(Reservation.start_date <= end_date)
        except ValueError:
            return jsonify({'message': 'end_date 형식이 잘못되었습니다. YYYY-MM-DD 형식을 사용해주세요.'}), 400

    # 장비 필터링
    equipment_id = request.args.get('equipment_id')
    if equipment_id:
        try:
            query = query.filter(Reservation.equipment_id == int(equipment_id))
        except ValueError:
             return jsonify({'message': 'equipment_id는 정수여야 합니다.'}), 400

    # 사용자 필터링
    user_id = request.args.get('user_id')
    if user_id:
        try:
            query = query.filter(Reservation.user_id == int(user_id))
        except ValueError:
            return jsonify({'message': 'user_id는 정수여야 합니다.'}), 400

    reservations = query.all()

    # 통계 계산
    equipment_usage = {}
    user_usage = {}
    total_days_in_period = 0

    if start_date and end_date:
        # Calculate total days in the requested period
        total_days_in_period = (end_date - start_date).days + 1
    elif start_date:
         # If only start_date is provided, calculate from start_date to today or a future date?
         # For now, let's assume a period is defined by both start and end.
         # If only one is provided, we might need clarification or a default behavior.
         # For simplicity, if only start_date is given, we'll calculate usage from that date onwards
         # but won't calculate 'days not used' relative to an end date.
         pass # Handle this case later if needed
    elif end_date:
         # If only end_date is provided, calculate up to end_date from the beginning of records?
         pass # Handle this case later if needed
    else:
        # If no dates are provided, calculate statistics for all time
        # Find the earliest reservation start date and the latest reservation end date
        earliest_res = Reservation.query.order_by(Reservation.start_date).first()
        latest_res = Reservation.query.order_by(Reservation.end_date.desc()).first()
        if earliest_res and latest_res:
            start_date = earliest_res.start_date
            end_date = latest_res.end_date
            total_days_in_period = (end_date - start_date).days + 1


    # Initialize equipment usage with all equipment, assuming 0 used days initially
    all_equipment = Equipment.query.all()
    for eq in all_equipment:
        equipment_usage[eq.name] = {
            'used_days': 0,
            'not_used_days': total_days_in_period if total_days_in_period > 0 else 'N/A', # N/A if no period defined
            'users': {} # To store which users used this equipment
        }

    # Initialize user usage with all users, assuming 0 used days initially
    all_users = User.query.all()
    for user in all_users:
        user_usage[user.name] = {
            'used_days': 0,
            'equipment': {} # To store which equipment this user used
        }


    for res in reservations:
        res_start = res.start_date
        res_end = res.end_date
        user_name = res.user.name if res.user else 'Unknown User'
        equipment_name = res.equipment.name if res.equipment else 'Unknown Equipment'

        # Calculate the overlap period between the reservation and the requested statistics period
        # The overlap starts at the later of the reservation start date and the period start date
        # The overlap ends at the earlier of the reservation end date and the period end date
        overlap_start = max(res_start, start_date) if start_date else res_start
        overlap_end = min(res_end, end_date) if end_date else res_end

        # Calculate the number of days in the overlap period
        # Ensure overlap_start is not after overlap_end
        if overlap_start <= overlap_end:
            overlap_days = (overlap_end - overlap_start).days + 1
        else:
            overlap_days = 0 # No overlap

        if overlap_days > 0:
            # Update equipment usage
            if equipment_name not in equipment_usage:
                 equipment_usage[equipment_name] = {
                    'used_days': 0,
                    'not_used_days': total_days_in_period if total_days_in_period > 0 else 'N/A',
                    'users': {}
                }
            equipment_usage[equipment_name]['used_days'] += overlap_days

            # Update user usage for this equipment
            if user_name not in equipment_usage[equipment_name]['users']:
                equipment_usage[equipment_name]['users'][user_name] = 0
            equipment_usage[equipment_name]['users'][user_name] += overlap_days


            # Update user usage
            if user_name not in user_usage:
                 user_usage[user_name] = {
                    'used_days': 0,
                    'equipment': {}
                }
            user_usage[user_name]['used_days'] += overlap_days

            # Update equipment usage for this user
            if equipment_name not in user_usage[user_name]['equipment']:
                user_usage[user_name]['equipment'][equipment_name] = 0
            user_usage[user_name]['equipment'][equipment_name] += overlap_days


    # Calculate not used days for equipment if a period was defined
    if total_days_in_period > 0:
        for eq_name in equipment_usage:
            equipment_usage[eq_name]['not_used_days'] = total_days_in_period - equipment_usage[eq_name]['used_days']


    return jsonify({
        'period_start': start_date.isoformat() if start_date else None,
        'period_end': end_date.isoformat() if end_date else None,
        'total_days_in_period': total_days_in_period if total_days_in_period > 0 else 'N/A',
        'equipment_usage': equipment_usage,
        'user_usage': user_usage
    })


# == 데이터 내보내기 API ==
@app.route('/api/export/csv', methods=['GET'])
def export_csv():
    """
    CSV 형식으로 통계 데이터 내보내기
    Query Parameters:
    - start_date: 시작 날짜 (YYYY-MM-DD)
    - end_date: 종료 날짜 (YYYY-MM-DD)
    - equipment_ids: 장비 ID 목록 (쉼표로 구분)
    - user_ids: 사용자 ID 목록 (쉼표로 구분)
    - group_by: 그룹화 기준 (equipment, user, month, weekday)
    """
    from io import StringIO
    import csv
    
    # 통계 데이터 가져오기 (statistics API와 동일한 로직 활용)
    stats_data = get_statistics()
    if isinstance(stats_data, tuple):  # 에러 응답인 경우
        return stats_data
    
    # 응답 객체에서 JSON 데이터 추출
    stats_dict = stats_data.get_json()
    
    # 그룹화 파라미터 확인
    group_by = request.args.get('group_by', 'equipment')
    
    # CSV 데이터 준비
    csv_output = StringIO()
    csv_writer = csv.writer(csv_output)
    
    # 헤더 추가
    csv_writer.writerow(['기간', f'{stats_dict.get("period_start", "N/A")} ~ {stats_dict.get("period_end", "N/A")}'])
    csv_writer.writerow(['총 일수', stats_dict.get("total_days_in_period", "N/A")])
    csv_writer.writerow([])
    
    if group_by == 'equipment':
        # 장비별 데이터
        csv_writer.writerow(['장비명', '사용 일수', '미사용 일수', '세부 내역'])
        for equipment_name, stats in stats_dict.get('equipment_usage', {}).items():
            detail = ', '.join([f"{user}: {days}일" for user, days in stats.get('users', {}).items()])
            csv_writer.writerow([equipment_name, stats.get('used_days', 0), stats.get('not_used_days', 'N/A'), detail])
    elif group_by == 'user':
        # 사용자별 데이터
        csv_writer.writerow(['사용자명', '총 사용 일수', '세부 내역'])
        for user_name, stats in stats_dict.get('user_usage', {}).items():
            detail = ', '.join([f"{equipment}: {days}일" for equipment, days in stats.get('equipment', {}).items()])
            csv_writer.writerow([user_name, stats.get('used_days', 0), detail])
    else:
        # 기본 형식
        csv_writer.writerow(['통계 형식이 지원되지 않습니다'])
    
    # 응답 생성
    response = app.response_class(
        response=csv_output.getvalue(),
        status=200,
        mimetype='text/csv'
    )
    response.headers["Content-Disposition"] = f"attachment; filename=equipment_stats_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return response

@app.route('/api/export/pdf', methods=['GET'])
def export_pdf():
    """
    PDF 형식으로 통계 데이터 내보내기 (서버 측에서 생성)
    실제 PDF 생성은 클라이언트에서 처리하는 것으로 대체 (서버측 PDF 생성에는 추가 라이브러리 필요)
    """
    # PDF 생성에는 ReportLab 또는 WeasyPrint 같은 추가 라이브러리가 필요함
    # 이 예제에서는 간단한 텍스트 기반 응답으로 대체
    
    return jsonify({
        'message': 'PDF 내보내기는 현재 클라이언트 측에서만 지원됩니다. CSV 내보내기를 이용해주세요.',
        'success': False
    }), 501  # 501 Not Implemented

# === 서버 메인 페이지 리다이렉트 (옵션) ===
# 사용자 정의 보고서 페이지 제거
# @app.route('/custom_report')
# def custom_report_redirect():
#     return send_from_directory(os.getcwd(), 'custom_report.html')

# --- 서버 실행 ---
if __name__ == '__main__':
    # 애플리케이션 컨텍스트 내에서 데이터베이스 테이블 생성
    with app.app_context():
        db.create_all()
        print("데이터베이스 테이블이 준비되었습니다 (reservations.db)")

        # --- 초기 데이터 추가 ---
        if not User.query.first(): # 사용자가 없으면 기본 사용자 추가
            print("기본 사용자 추가 중...")
            users = [
                User(name='연구원A'),
                User(name='연구원B'),
                User(name='책임연구원')
            ]
            db.session.add_all(users)
            db.session.commit()
            print("기본 사용자 추가 완료")

        if not Equipment.query.first(): # 장비가 없으면 기본 장비 추가
            print("기본 장비 추가 중...")
            equipment = [
                Equipment(name='현미경 #1', description='광학 현미경'),
                Equipment(name='원심분리기', description='샘플 분리용'),
                Equipment(name='분광광도계', description='물질 농도 측정')
            ]
            db.session.add_all(equipment)
            db.session.commit()
            print("기본 장비 추가 완료")

        # --- 더미 예약 데이터 추가 ---
        if not Reservation.query.first(): # 예약이 없으면 더미 예약 추가
            print("더미 예약 데이터 추가 중...")
            user_a = User.query.filter_by(name='연구원A').first()
            user_b = User.query.filter_by(name='연구원B').first()
            user_c = User.query.filter_by(name='책임연구원').first()
            microscope = Equipment.query.filter_by(name='현미경 #1').first()
            centrifuge = Equipment.query.filter_by(name='원심분리기').first()
            spectrophotometer = Equipment.query.filter_by(name='분광광도계').first()

            if user_a and user_b and user_c and microscope and centrifuge and spectrophotometer:
                dummy_reservations = [
                    # 연구원A - 현미경 #1
                    Reservation(user_id=user_a.id, equipment_id=microscope.id, start_date=date(2024, 10, 1), end_date=date(2024, 10, 5), purpose='샘플 관찰'),
                    Reservation(user_id=user_a.id, equipment_id=microscope.id, start_date=date(2024, 11, 10), end_date=date(2024, 11, 12), purpose='실험 데이터 수집'),
                    Reservation(user_id=user_a.id, equipment_id=microscope.id, start_date=date(2025, 1, 20), end_date=date(2025, 1, 25), purpose='새 샘플 테스트'),

                    # 연구원B - 원심분리기
                    Reservation(user_id=user_b.id, equipment_id=centrifuge.id, start_date=date(2024, 10, 3), end_date=date(2024, 10, 3), purpose='샘플 분리'),
                    Reservation(user_id=user_b.id, equipment_id=centrifuge.id, start_date=date(2024, 12, 1), end_date=date(2024, 12, 5), purpose='대량 샘플 처리'),
                    Reservation(user_id=user_b.id, equipment_id=centrifuge.id, start_date=date(2025, 2, 15), end_date=date(2025, 2, 16), purpose='정기 유지보수 전 사용'),

                    # 책임연구원 - 분광광도계
                    Reservation(user_id=user_c.id, equipment_id=spectrophotometer.id, start_date=date(2024, 10, 15), end_date=date(2024, 10, 17), purpose='물질 농도 분석'),
                    Reservation(user_id=user_c.id, equipment_id=spectrophotometer.id, start_date=date(2025, 3, 1), end_date=date(2025, 3, 7), purpose='새로운 시약 테스트'),

                    # 연구원A - 원심분리기
                    Reservation(user_id=user_a.id, equipment_id=centrifuge.id, start_date=date(2024, 11, 5), end_date=date(2024, 11, 6), purpose='추가 샘플 분리'),

                    # 연구원B - 현미경 #1
                    Reservation(user_id=user_b.id, equipment_id=microscope.id, start_date=date(2025, 3, 10), end_date=date(2025, 3, 14), purpose='미세 구조 관찰'),

                    # 책임연구원 - 현미경 #1 (겹치는 기간)
                    Reservation(user_id=user_c.id, equipment_id=microscope.id, start_date=date(2025, 3, 12), end_date=date(2025, 3, 15), purpose='긴급 분석'),

                    # 다양한 기간의 예약
                    Reservation(user_id=user_a.id, equipment_id=spectrophotometer.id, start_date=date(2024, 9, 1), end_date=date(2024, 9, 30), purpose='장기 프로젝트'),
                    Reservation(user_id=user_b.id, equipment_id=microscope.id, start_date=date(2024, 8, 15), end_date=date(2024, 8, 20), purpose='여름 연구'),
                    Reservation(user_id=user_c.id, equipment_id=centrifuge.id, start_date=date(2025, 4, 1), end_date=date(2025, 4, 10), purpose='봄 실험')
                ]
                db.session.add_all(dummy_reservations)
                db.session.commit()
                print("더미 예약 데이터 추가 완료")
            else:
                print("더미 예약 데이터 추가 실패: 사용자 또는 장비를 찾을 수 없습니다.")


     # 서버 실행 (네트워크 내 다른 기기에서 접속 가능하도록 host='0.0.0.0' 설정)
    print("Flask 서버를 시작합니다...")
    app.run(debug=True, host='0.0.0.0', port=5000) # debug=True는 개발 중에만 사용
