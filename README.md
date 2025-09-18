# Team KEO Tournament Ban/Pick System

한국어 토너먼트 밴픽 시스템 - React와 Node.js를 사용한 실시간 웹 애플리케이션

## 🎮 프로젝트 개요

Team KEO의 토너먼트를 위한 웹 기반 밴픽 시스템입니다. 선수들이 실시간으로 밴픽을 진행할 수 있는 인터페이스를 제공합니다.

## ✨ 주요 기능

### 🔐 사용자 인증
- JWT 기반 인증 시스템
- 회원가입/로그인
- 프로필 관리
- 토너먼트 통계

### 🏟️ 토너먼트 관리
- 방 생성 및 참여
- 실시간 플레이어 관리
- 토너먼트 상태 추적

### ⚔️ 밴픽 시스템
- **드래프트 밴픽**: 초기 오퍼레이터 모집 단계
- **그룹 밴픽**: 경기 중 영구 밴픽
- 실시간 턴 기반 진행
- 타이머 시스템 (20초 선택 시간, 120초 예비 시간)
- 성급 순서 제한 규칙
- 피어리스 룰 적용

### 🎯 실시간 기능
- Socket.IO를 통한 실시간 동기화
- 실시간 채팅 (향후 추가 예정)
- 즉시 상태 업데이트
- 연결 상태 모니터링

## 🛠️ 기술 스택

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **Socket.IO** (실시간 통신)
- **JWT** (인증)
- **bcryptjs** (비밀번호 암호화)

### Frontend
- **React** + **TypeScript**
- **React Router** (라우팅)
- **Styled Components** (스타일링)
- **Socket.IO Client** (실시간 통신)
- **React Hot Toast** (알림)

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/ibmaster1000/BAN_PICK.git
cd BAN_PICK
```

### 2. 의존성 설치
```bash
npm run install-all
```

### 3. 환경 변수 설정
```bash
cp .env.example .env
```

`.env` 파일을 편집하여 다음 값들을 설정하세요:
```env
MONGODB_URI=mongodb://localhost:27017/teamkeo-tourney
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
PORT=5000
NODE_ENV=development
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. MongoDB 실행
MongoDB가 설치되어 있고 실행 중인지 확인하세요.

### 5. 애플리케이션 실행
```bash
# 개발 모드 (백엔드 + 프론트엔드 동시 실행)
npm run dev

# 또는 개별 실행
npm run server  # 백엔드만
npm run client  # 프론트엔드만
```

### 6. 접속
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5000

## 📁 프로젝트 구조

```
TeamKEOtourneyBANpick/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── contexts/       # React Context (인증, 밴픽)
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── services/       # API 서비스
│   │   └── ...
│   └── package.json
├── server/                 # Node.js 백엔드
│   ├── config/             # 데이터베이스 설정
│   ├── middleware/         # 미들웨어 (인증, 에러 처리)
│   ├── models/             # MongoDB 모델
│   ├── routes/             # API 라우트
│   ├── socket/             # Socket.IO 핸들러
│   └── index.js
├── package.json
└── README.md
```

## 🎯 밴픽 규칙

### 드래프트 밴픽
- **선택 시간**: 20초
- **예비 시간**: 120초
- **성급 순서 제한**: 이전 선택보다 같거나 높은 성급만 선택 가능
- **피어리스 룰**: 이전 라운드에서 선택된 오퍼레이터는 이후 라운드에서 사용 불가

### 그룹 밴픽
- **엔트리**: 8명
- **추첨 없이 즉시 밴**
- **영구 밴**: 경기 중 적용되는 영구 밴픽

## 🔧 개발 가이드

### API 엔드포인트
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보
- `GET /api/tournament/rooms` - 방 목록
- `POST /api/tournament/rooms` - 방 생성
- `POST /api/banpick/:roomId/start` - 밴픽 시작
- `POST /api/banpick/:roomId/ban` - 오퍼레이터 밴
- `POST /api/banpick/:roomId/pick` - 오퍼레이터 픽

### Socket.IO 이벤트
- `joinRoom` - 방 참여
- `leaveRoom` - 방 나가기
- `startBanPick` - 밴픽 시작
- `banOperator` - 오퍼레이터 밴
- `pickOperator` - 오퍼레이터 픽
- `setReady` - 준비 상태 변경

## 📝 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 연락처

- **GitHub**: https://github.com/ibmaster1000/BAN_PICK
- **이메일**: [이메일 주소]

---

**살카즈의 영겁기담, 승천 16** - Team KEO Tournament Ban/Pick System