import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const MINIMUM_COOLDOWN = 60000;
const BATCH_INTERVAL = 1500;
const BATCH_SIZE = 1;
const STORAGE_KEY = "blogViewBoosterUrls";

const api = axios.create({
  baseURL: "http://localhost:3001",
  timeout: 180000, // 3분 (체류시간 고려)
});

function App() {
  const [urls, setUrls] = useState(() => {
    const savedUrls = localStorage.getItem(STORAGE_KEY);
    return savedUrls
      ? JSON.parse(savedUrls)
      : [
          "https://blog.naver.com/alice__hm/224117851115",
          "https://blog.naver.com/alice__hm/224111731085",
          "https://blog.naver.com/alice__hm/224109188626",
          "https://blog.naver.com/alice__hm/224106459890",
          "https://blog.naver.com/alice__hm/224088047947",
          "https://blog.naver.com/alice__hm/224075571417",
          "https://blog.naver.com/alice__hm/224099570810",
          "https://blog.naver.com/alice__hm/224094680364",
          "https://blog.naver.com/alice__hm/224083557306",
          "https://blog.naver.com/alice__hm/224080952200",
          "https://blog.naver.com/alice__hm/224068530222",
          "https://blog.naver.com/alice__hm/224056850474",
          "https://blog.naver.com/alice__hm/224049764558",
          "https://blog.naver.com/alice__hm/224046834363",
          "https://blog.naver.com/alice__hm/224042456003",
          "https://blog.naver.com/alice__hm/224041150462",
          "https://blog.naver.com/alice__hm/224038135042",
          "https://blog.naver.com/alice__hm/224035221923",
          "https://blog.naver.com/alice__hm/224034443804",
          "https://blog.naver.com/alice__hm/224031054824",
          "https://blog.naver.com/alice__hm/224027992096",
          "https://blog.naver.com/alice__hm/224027558521",
        ];
  });

  const [newUrl, setNewUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [viewCounts, setViewCounts] = useState({});
  const [status, setStatus] = useState("");
  const [totalViews, setTotalViews] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const pendingRequests = useRef(new Set());
  const urlCooldowns = useRef({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
  }, [urls]);

  useEffect(() => {
    const total = Object.values(viewCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    setTotalViews(total);
  }, [viewCounts]);

  const increaseViewCount = useCallback(async (url) => {
    if (pendingRequests.current.has(url)) return;

    const now = Date.now();
    const cooldown = urlCooldowns.current[url];
    if (cooldown && now < cooldown) return;

    pendingRequests.current.add(url);

    try {
      const response = await api.get(`/visit?url=${encodeURIComponent(url)}`);

      if (response.status === 200) {
        setViewCounts((prev) => ({ ...prev, [url]: (prev[url] || 0) + 1 }));
        urlCooldowns.current[url] = Date.now() + MINIMUM_COOLDOWN;
      }
    } catch (error) {
      console.error("Error:", error.message);
      if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.remainingTime || 4;
        urlCooldowns.current[url] = Date.now() + retryAfter * 1000;
      } else {
        urlCooldowns.current[url] = Date.now() + 5000;
      }
    } finally {
      pendingRequests.current.delete(url);
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    let processInterval;
    const processUrls = async () => {
      if (!isRunning || urls.length === 0) return;

      const now = Date.now();
      const availableUrls = urls.filter((url) => {
        const cooldown = urlCooldowns.current[url];
        return (
          (!cooldown || now >= cooldown) && !pendingRequests.current.has(url)
        );
      });

      if (availableUrls.length === 0) {
        const cooldownValues = Object.values(urlCooldowns.current);
        if (cooldownValues.length > 0) {
          const nextAvailable = Math.min(...cooldownValues) - now;
          setStatus(
            `모든 URL이 쿨다운 중... ${Math.max(
              0,
              Math.ceil(nextAvailable / 1000)
            )}초 대기 중`
          );
        }
        return;
      }

      const urlsToProcess = availableUrls.slice(0, BATCH_SIZE);
      const shuffledUrls = urlsToProcess.sort(() => Math.random() - 0.5);
      setStatus(`${shuffledUrls.length}개 URL 처리 중...`);

      await Promise.all(shuffledUrls.map((url) => increaseViewCount(url)));
    };

    processInterval = setInterval(processUrls, BATCH_INTERVAL);
    processUrls();

    return () => {
      if (processInterval) {
        clearInterval(processInterval);
      }
    };
  }, [isRunning, urls, increaseViewCount]);

  const addUrl = useCallback(() => {
    if (!newUrl) return;

    try {
      new URL(newUrl);
    } catch {
      alert("유효한 URL을 입력해주세요");
      return;
    }

    if (!urls.includes(newUrl)) {
      setUrls((prev) => [...prev, newUrl]);
      setViewCounts((prev) => ({ ...prev, [newUrl]: 0 }));
      setNewUrl("");
    } else {
      alert("이미 추가된 URL입니다");
    }
  }, [newUrl, urls]);

  const startViewing = useCallback(() => {
    if (urls.length === 0) {
      alert("URL을 먼저 추가해주세요");
      return;
    }
    setIsRunning(true);
    setStartTime(Date.now());
    setStatus("조회수 증가 시작...");
    urlCooldowns.current = {};
    pendingRequests.current.clear();
  }, [urls]);

  const stopViewing = useCallback(() => {
    setIsRunning(false);
    setStatus("중지됨");
    pendingRequests.current.clear();
  }, []);

  const getRunningTime = () => {
    if (!startTime || !isRunning) return "0분";
    const minutes = Math.floor((Date.now() - startTime) / 60000);
    return `${minutes}분`;
  };

  const getViewsPerMinute = () => {
    if (!startTime || !isRunning) return 0;
    const minutes = (Date.now() - startTime) / 60000;
    return minutes > 0 ? Math.round(totalViews / minutes) : 0;
  };

  return (
    <div
      className="App"
      style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}
    >
      <h1>블로그 뷰 부스터 Pro</h1>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="블로그 주소를 입력하세요"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          style={{ width: "60%", padding: "8px", marginRight: "10px" }}
          onKeyPress={(e) => e.key === "Enter" && addUrl()}
        />
        <button
          onClick={addUrl}
          style={{ padding: "8px 15px", marginRight: "10px" }}
        >
          URL 추가
        </button>
        <button
          onClick={isRunning ? stopViewing : startViewing}
          style={{
            padding: "8px 15px",
            backgroundColor: isRunning ? "#ff4444" : "#4CAF50",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isRunning ? "중지" : "시작"}
        </button>
      </div>

      <div
        style={{
          padding: "10px",
          backgroundColor: "#f0f0f0",
          borderRadius: "5px",
          marginBottom: "20px",
        }}
      >
        <div>상태: {status}</div>
        <div>총 조회수: {totalViews}</div>
        <div>실행 시간: {getRunningTime()}</div>
        <div>분당 조회수: {getViewsPerMinute()}</div>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {urls.map((url) => (
          <li
            key={url}
            style={{
              padding: "10px",
              margin: "5px 0",
              backgroundColor: pendingRequests.current.has(url)
                ? "#fff3e0"
                : "white",
              border: "1px solid #ddd",
              borderRadius: "5px",
              transition: "background-color 0.3s",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ marginRight: "10px" }}>{url}</span>
                <span style={{ color: "#666" }}>
                  조회수: {viewCounts[url] || 0}
                </span>
              </div>
              <button
                onClick={() => {
                  setUrls(urls.filter((u) => u !== url));
                  setViewCounts((prev) => {
                    const newCounts = { ...prev };
                    delete newCounts[url];
                    return newCounts;
                  });
                  delete urlCooldowns.current[url];
                  pendingRequests.current.delete(url);
                }}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#ff4444",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                }}
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;