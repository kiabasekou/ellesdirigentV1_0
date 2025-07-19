export const performHealthCheck = async () => {
  const checks = {
    api: false,
    auth: false,
    websocket: false
  };

  try {
    // Test API
    const apiResponse = await fetch(`${process.env.REACT_APP_API_URL}/health/`);
    checks.api = apiResponse.ok;

    // Test Auth
    const token = localStorage.getItem('access_token');
    if (token) {
      const authResponse = await fetch(`${process.env.REACT_APP_API_URL}/users/me/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      checks.auth = authResponse.ok;
    }

    // Test WebSocket
    const ws = new WebSocket(process.env.REACT_APP_SOCKET_URL);
    ws.onopen = () => {
      checks.websocket = true;
      ws.close();
    };

    return checks;
  } catch (error) {
    console.error('Health check failed:', error);
    return checks;
  }
};