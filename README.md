# 🔐 Quantum Secure Messenger

### Real-Time Messaging with Quantum Key Distribution (QKD) using Qiskit Aer

---

## 🚀 Overview

This project implements a **Quantum-Secured Messaging System** that integrates **Quantum Key Distribution (QKD)** with real-time communication.

Unlike traditional encryption systems, this application uses **quantum principles** to generate secure keys and detect eavesdropping using **Quantum Bit Error Rate (QBER)**.

👉 Built as a **simulation of practical quantum cryptography systems** using Qiskit Aer.

---

## 🧠 Why This Project Matters

Modern encryption relies on computational hardness.
This project explores **information-theoretic security**, where:

* Any interception attempt **disturbs quantum states**
* Security is guaranteed by **physics, not assumptions**

---

## 🔑 Core Quantum Features

### 🧪 Six-State Protocol (Advanced QKD)

* Uses **3 measurement bases** instead of 2 (BB84)
* Provides **higher eavesdropping sensitivity**
* Simulated using Qiskit Aer

---

### 📊 QBER (Quantum Bit Error Rate)

* Measures noise / interference in quantum transmission
* Used to:

  * Detect eavesdropping
  * Decide whether to accept/reject keys

```
QBER < 11%  → Secure Key ✅  
QBER > 11%  → Possible Attack 🚨
```

---

### ⚡ Noise Simulation (Realistic Modeling)

Implemented using Qiskit Aer:

* Bit-flip noise
* Depolarizing noise

📌 This simulates **real-world quantum channel imperfections**

---

## 💬 System Features

* 🔐 Quantum-secured key generation
* 💬 Real-time messaging (WebSockets)
* 👥 Friend system (request / accept / reject)
* ⚠️ Live security alerts (attack detection)
* 🔁 Dynamic key refresh
* 🟢 Online/offline presence

---

## 🏗️ Architecture

```
Frontend (React + Tailwind)
        ↓
WebSocket + REST API
        ↓
FastAPI Backend
        ↓
Qiskit Aer Simulator (Quantum Layer)
```

---

## 🧰 Tech Stack

### Backend

* FastAPI
* WebSockets
* Python

### Frontend

* React (CDN)
* Tailwind CSS

### Quantum Layer

* Qiskit
* Qiskit Aer Simulator

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```
git clone https://github.com/YOUR_USERNAME/Quantum-Secure-Messenger.git
cd Quantum-Secure-Messenger
```

---

### 2️⃣ Backend Setup

```
cd server
python -m venv .venv
.venv\Scripts\activate

pip install -r requirements.txt
```

---

### 3️⃣ Run Server

```
uvicorn main:app --reload --port 3000
```

---

### 4️⃣ Run Application

Open in browser:

```
http://127.0.0.1:3000
```

---

## 📈 Sample Runtime Output

```
✓ Qiskit Aer loaded successfully
Protocol: Six-State
Key length: 256 bits
QBER threshold: 11%
```

---

## 🔍 Security Model

| Scenario            | Outcome                     |
| ------------------- | --------------------------- |
| No interference     | Low QBER → Key accepted ✅   |
| Noise present       | Moderate QBER               |
| Eavesdropping (Eve) | High QBER → Key rejected 🚨 |

---

## 🎯 Research Value

This project demonstrates:

* Practical implementation of QKD protocols
* Impact of noise on quantum communication
* Real-time integration of quantum + classical systems
* Detection of adversarial interference via QBER

---

## 🔮 Future Work

* Integration with real quantum hardware (IBM Quantum)
* Error correction & privacy amplification
* Persistent storage (DB)
* End-to-end encrypted file sharing
* Deployment on cloud

---

## 👩‍💻 Author

**Sripragna Akula**

---

## ⭐ If you find this interesting

Consider giving a ⭐ — it helps visibility!

---
