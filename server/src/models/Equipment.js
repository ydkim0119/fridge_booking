const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    default: '#3B82F6', // 기본 파란색
    validate: {
      validator: function(v) {
        // Hex 색상 코드 검증
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: '유효한 HEX 색상 코드를 입력하세요 (예: #RRGGBB)'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Equipment = mongoose.model('Equipment', equipmentSchema);

module.exports = Equipment;
