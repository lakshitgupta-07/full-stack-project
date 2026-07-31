import { threadId } from "node:worker_threads";
import { io } from "socket.io-client";

const socket = io("http://localhost:8000", {
  auth: {
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNjJmZWRkNTIwOTBhMmY4MGE0ZGZhNiIsImVtYWlsIjoibGFrc2hpdC5ndXB0YUB0ZXRyLm9yZyIsInVzZXJuYW1lIjoibGFrc2hpdGd1cHRhIiwiaWF0IjoxNzg1NDA3OTUxLCJleHAiOjE3ODU0OTQzNTF9.TXaWVhVpT20zPGH-2j9asggTjOzmFQxe-Unf7V260FY",
  },
});

socket.on("connect", () => {
  console.log("connected as user A");
  socket.emit(
    "create-thread",
    {
      receiverId: "6a632f60d0ab6666b9227974",
    },
    (response: any) => {
      console.log(response);
    },
  );
});

socket.on("connect_error", (err) => {
  console.error("Client A connection error:", err.message);
});

socket.on("thread-accepted", (thread) => {
  console.log("Thread accepted");
  socket.emit(
    "join-thread",
    {
      threadId: thread._id,
    },
    (response: any) => {
      console.log("Thread joined");
      console.log(response);
    },
  );
  setTimeout(() => {
    socket.emit(
      "typing",
      {
        threadId: thread._id,
      },
      (response: any) => {
        console.log(response);
      },
    );
  }, 3000);
  setTimeout(() => {
    socket.emit(
      "stop-typing",
      {
        threadId: thread._id,
      },
      (response: any) => {
        console.log(response)
      },
    );
  }, 4000);

  setTimeout(() => {
    socket.emit(
      "send-message",
      {
        threadId: thread._id,
        textMessage: "Hello after accepting thread",
        image: {
          url: "https://picsum.photos/600/400",
          publicId: "sample-image",
        },
      },
      (response: any) => {
        console.log(response);
      },
    );
  }, 5000);
  setTimeout(() => {
    socket.emit(
      "get-thread-message",
      {
        threadId: thread._id,
      },
      (response: any) => {
        console.log("History");
        console.log(response);
      },
    );
  }, 6000);
});

// socket.on("message-seen", (data) => {
//     console.log("Message Seen");
//     console.log(data)
// })

// socket.on("message-delivered", (data) => {
//     console.log("Message delivered");
//     console.log(data)
// })
