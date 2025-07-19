fetch("http://127.0.0.1:8000/api/verify-nip/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nip: "123456789012" }),
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(error => console.error("Erreur :", error));