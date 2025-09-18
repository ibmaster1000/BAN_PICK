const mongoose = require('mongoose');
const http = require('http');

// 테스트 설정
const API_BASE_URL = 'http://localhost:5000/api';
const MONGODB_URI = 'mongodb://localhost:27017/teamkeo-tourney';

console.log('🚀 백엔드 테스트 시작...\n');

// 1. MongoDB 연결 테스트
async function testMongoDBConnection() {
  console.log('1️⃣ MongoDB 연결 테스트...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 연결 성공!');
    
    // 간단한 스키마로 테스트
    const testSchema = new mongoose.Schema({
      name: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('Test', testSchema);
    
    // 데이터 삽입 테스트
    const testDoc = await TestModel.create({ name: '백엔드 테스트' });
    console.log('✅ 데이터 삽입 성공:', testDoc.name);
    
    // 데이터 조회 테스트
    const foundDoc = await TestModel.findById(testDoc._id);
    console.log('✅ 데이터 조회 성공:', foundDoc.name);
    
    // 테스트 데이터 정리
    await TestModel.deleteMany({});
    console.log('✅ 테스트 데이터 정리 완료');
    
    await mongoose.disconnect();
    console.log('✅ MongoDB 연결 해제\n');
    return true;
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error.message);
    return false;
  }
}

// 2. API 서버 연결 테스트
async function testAPIServer() {
  console.log('2️⃣ API 서버 연결 테스트...');
  return new Promise((resolve) => {
    const req = http.get(`${API_BASE_URL}/health`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ API 서버 연결 성공!');
          try {
            const responseData = JSON.parse(data);
            console.log('📊 서버 상태:', responseData);
          } catch (e) {
            console.log('📊 서버 응답:', data);
          }
          resolve(true);
        } else {
          console.error('❌ API 서버 응답 오류:', res.statusCode);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ API 서버가 실행되지 않음 (포트 5000)');
        console.log('💡 해결방법: npm run server 명령어로 서버 실행');
      } else {
        console.error('❌ API 서버 연결 실패:', error.message);
      }
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.error('❌ API 서버 연결 시간 초과');
      req.destroy();
      resolve(false);
    });
  });
}

// 3. 인증 API 테스트
async function testAuthAPI() {
  console.log('3️⃣ 인증 API 테스트...');
  return new Promise((resolve) => {
    const registerData = JSON.stringify({
      username: 'testuser_' + Date.now(),
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
      confirmPassword: 'password123',
      displayName: '테스트 사용자'
    });
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(registerData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log('✅ 회원가입 API 성공');
          resolve(true);
        } else {
          console.error('❌ 회원가입 API 실패:', res.statusCode);
          try {
            const errorData = JSON.parse(data);
            console.error('📋 오류 상세:', errorData);
          } catch (e) {
            console.error('📋 오류 응답:', data);
          }
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ 인증 API 연결 실패:', error.message);
      resolve(false);
    });
    
    req.write(registerData);
    req.end();
  });
}

// 4. 토너먼트 API 테스트
async function testTournamentAPI() {
  console.log('4️⃣ 토너먼트 API 테스트...');
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/tournament/rooms',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer dev-token-12345'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ 방 목록 조회 성공');
          resolve(true);
        } else {
          console.error('❌ 토너먼트 API 실패:', res.statusCode);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ 토너먼트 API 연결 실패:', error.message);
      resolve(false);
    });
    
    req.end();
  });
}

// 메인 테스트 실행
async function runTests() {
  const results = {
    mongodb: false,
    apiServer: false,
    authAPI: false,
    tournamentAPI: false
  };
  
  // 각 테스트 실행
  results.mongodb = await testMongoDBConnection();
  results.apiServer = await testAPIServer();
  
  if (results.apiServer) {
    results.authAPI = await testAuthAPI();
    results.tournamentAPI = await testTournamentAPI();
  }
  
  // 결과 요약
  console.log('\n📋 테스트 결과 요약:');
  console.log('='.repeat(50));
  console.log(`MongoDB 연결:     ${results.mongodb ? '✅ 성공' : '❌ 실패'}`);
  console.log(`API 서버 연결:     ${results.apiServer ? '✅ 성공' : '❌ 실패'}`);
  console.log(`인증 API:         ${results.authAPI ? '✅ 성공' : '❌ 실패'}`);
  console.log(`토너먼트 API:      ${results.tournamentAPI ? '✅ 성공' : '❌ 실패'}`);
  console.log('='.repeat(50));
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  if (successCount === totalCount) {
    console.log('🎉 모든 테스트 통과! 백엔드가 정상적으로 작동합니다.');
  } else {
    console.log(`⚠️  ${successCount}/${totalCount} 테스트 통과. 일부 기능에 문제가 있을 수 있습니다.`);
  }
  
  process.exit(successCount === totalCount ? 0 : 1);
}

// 에러 핸들링
process.on('unhandledRejection', (error) => {
  console.error('❌ 예상치 못한 오류:', error.message);
  process.exit(1);
});

// 테스트 실행
runTests();