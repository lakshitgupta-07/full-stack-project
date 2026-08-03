import { io } from "socket.io-client";

const socket = io("http://localhost:8000", {
  auth: {
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNjMyZjYwZDBhYjY2NjZiOTIyNzk3NCIsImVtYWlsIjoibGFrc2hpdGd1cHRhMDcwQGdtYWlsLmNvbSIsInVzZXJuYW1lIjoibGFrc2hpdGd1cHRhMSIsImlhdCI6MTc4NTQ5NTM5MiwiZXhwIjoxNzg1NTgxNzkyfQ.creq-fny3zE0tDV_1rrvmBpyGN-UlfZzo49zcg9cwAM",
  },
});

socket.on("connect", () => {
  console.log("connected as user B");
});

socket.on("connect_error", (err) => {
  console.error("Client B connection error:", err.message);
});

socket.on("thread-request", (thread) => {
  console.log("Thread received from A");
  console.log(thread);
  socket.emit(
    "accept-thread",
    {
      threadId: thread._id,
    },
    (response: any) => {
      console.log(response);
    },
  );
  socket.emit(
    "join-thread",
    {
      threadId: thread._id,
    },
    (response: any) => {
      console.log("Joining thread room")
      console.log(response)
    }
  )
});

socket.on(
  "user-typing",
  (payload) => {
    console.log(payload.username, "is typing")
  }
)

socket.on(
  "user-stopped-typing",
  () => {
    console.log("User stopped typing")
  }
)

socket.on("new-message", (message) => {
  console.log("User B recieved");
  console.log(message);
    socket.emit(
    "message-delivered",
    {
        messageId: message._id
    },
    (response: any) => {
      console.log("ACK");
      console.log(response)
    }
  )
})

socket.on(
  "user-online",
  (user) => {
    console.log("Online");
    console.log(user)
  }
)

socket.on(
  "user-offline",
  (user) => {
    console.log("Offline");
    console.log(user)
  }
)

socket.on(
  "online-users",
  (users) => {
    console.log("Online-Users")
    console.log(users)
  }
)

socket.on("message-delivered", (data) => {
    console.log("Message delivered");
    console.log(data)
})
//   setTimeout(() => {
//     socket.emit(
//       "message-seen",
//       {
//         messageId: message._id,
//       },
//       (response: any) => {
//         console.log("SEEN CALLBACK");
//         console.log(response);
//       },
//     );
//   }, 5000);
// });
