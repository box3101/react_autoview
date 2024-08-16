import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [urls, setUrls] = useState([]); // URL 목록을 저장할 상태 변수
  const [newUrl, setNewUrl] = useState(""); // 새 URL 입력을 위한 상태 변수
  const [isRunning, setIsRunning] = useState(false); // 조회수 증가 중인지 여부를 저장할 상태 변수
  const [viewCounts, setViewCounts] = useState({}); // 각 URL별 조회수를 저장할 객체
  const [intervalId, setIntervalId] = useState(null); // 타이머 ID를 저장할 상태 변수

  useEffect(() => { // 컴포넌트가 처음 렌더링될 때만 실행
    return () => { // 컴포넌트가 소멸될 때 실행
      if (intervalId) { // intervalId가 존재하면
        clearInterval(intervalId); // intervalId를 사용해 타이머 중지
      }
    };
  }, [intervalId]); // intervalId가 변경될 때만 실행

  const addUrl = () => { // URL 추가 버튼 클릭 시 호출
    if (newUrl && !urls.includes(newUrl)) { // newUrl이 비어있지 않고 중복되지 않으면
      setUrls([...urls, newUrl]); // URL 목록에 newUrl 추가
      setViewCounts(prev => ({ ...prev, [newUrl]: 0 })); // viewCounts에 newUrl 추가
      setNewUrl(""); // newUrl 초기화
    }
  };
  
  const startViewing = () => { // 조회수 증가 시작 버튼 클릭 시 호출
    if (isRunning) return;  // 이미 실행 중이면 중복 실행 방지

    const id = setInterval(() => { // 5초마다 실행
      urls.forEach(increaseViewCount); // 모든 URL에 대해 조회수 증가 함수 호출
    }, 5000); // 5초

    setIntervalId(id); // intervalId 업데이트
    setIsRunning(true);   // 실행 중 상태로 변경
  }; 

  const stopViewing = () => {  // 조회수 증가 중지 버튼 클릭 시 호출  
    if (intervalId) { // intervalId가 존재하면
      clearInterval(intervalId); // intervalId를 사용해 타이머 중지
      setIntervalId(null); // intervalId 초기화
      setIsRunning(false); // 실행 중지 상태로 변경
    }
  };

  const increaseViewCount = async (url) => { // 조회수 증가 함수
    try {
      await axios.get(`http://localhost:3001/visit?url=${encodeURIComponent(url)}`); // 서버에 GET 요청
      setViewCounts(prev => ({ ...prev, [url]: prev[url] + 1 })); // viewCounts 업데이트
      console.log(`조회수 증가: ${url}`); // 콘솔에 로그 출력
    } catch (error) { // 에러 발생 시
      console.error('에러 발생:', error); // 콘솔에 에러 로그 출력
      // 에러 처리 로직...
    }
  };

  return (
    <div className="App">
      <h1>블로그 뷰 부스터</h1>
      <input
        type="text"
        placeholder="블로그 주소를 입력하세요"
        value={newUrl}
        onChange={(e) => setNewUrl(e.target.value)}
      />
      <button onClick={addUrl}>URL 추가</button>
      <button onClick={isRunning ? stopViewing : startViewing}>
        {isRunning ? "중지" : "시작"}
      </button>
      <ul>
        {urls.map(url => (
          <li key={url}>
            {url}: {viewCounts[url]} 조회
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;