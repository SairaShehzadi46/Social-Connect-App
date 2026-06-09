const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// In-memory store for posts
let posts = [
  {
    id: '1',
    authorId: 'dummy1',
    authorName: 'System',
    authorPic: null,
    text: 'Welcome to the Real-Time Social Connect!',
    image: null,
    timestamp: Date.now(),
    likes: [],
    comments: []
  }
];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send initial posts to the newly connected user
  socket.emit('initial_posts', posts);

  // Handle new post
  socket.on('add_post', (post) => {
    posts = [post, ...posts];
    io.emit('post_added', post);
  });

  // Handle like toggle
  socket.on('toggle_like', ({ postId, userId }) => {
    let updatedPost = null;
    posts = posts.map(post => {
      if (post.id === postId) {
        const hasLiked = post.likes.includes(userId);
        const newLikes = hasLiked 
          ? post.likes.filter(id => id !== userId) 
          : [...post.likes, userId];
        
        updatedPost = { ...post, likes: newLikes };
        return updatedPost;
      }
      return post;
    });

    if (updatedPost) {
      io.emit('post_updated', updatedPost);
      // Emit a specific event for notifications if someone ELSE liked the post
      if (!updatedPost.likes.includes(userId) === false && updatedPost.authorId !== userId) {
        io.emit('notification', {
          type: 'like',
          recipientId: updatedPost.authorId,
          postId: updatedPost.id,
          message: 'Someone liked your post!'
        });
      }
    }
  });

  // Handle new comment
  socket.on('add_comment', ({ postId, comment }) => {
    let updatedPost = null;
    posts = posts.map(post => {
      if (post.id === postId) {
        updatedPost = { ...post, comments: [...post.comments, comment] };
        return updatedPost;
      }
      return post;
    });

    if (updatedPost) {
      io.emit('post_updated', updatedPost);
      if (updatedPost.authorId !== comment.authorId) {
        io.emit('notification', {
          type: 'comment',
          recipientId: updatedPost.authorId,
          postId: updatedPost.id,
          message: `${comment.authorName} commented on your post!`
        });
      }
    }
  });

  // Handle edit post
  socket.on('edit_post', ({ postId, text, image }) => {
    let updatedPost = null;
    posts = posts.map(post => {
      if (post.id === postId) {
        updatedPost = { ...post, text, image };
        return updatedPost;
      }
      return post;
    });

    if (updatedPost) {
      io.emit('post_updated', updatedPost);
    }
  });

  // Handle delete post
  socket.on('delete_post', (postId) => {
    posts = posts.filter(post => post.id !== postId);
    io.emit('post_deleted', postId);
  });

  // In-memory store for chats
  // Format: { id: "user1_user2", participants: ["user1", "user2"], messages: [...] }
  let chats = [];

  // Handle new message
  socket.on('send_message', (message) => {
    const { senderId, receiverId, text, timestamp } = message;
    const chatId = [senderId, receiverId].sort().join('_');

    let chat = chats.find(c => c.id === chatId);
    if (!chat) {
      chat = { id: chatId, participants: [senderId, receiverId], messages: [] };
      chats.push(chat);
    }

    const newMessage = { id: Date.now().toString(), senderId, text, timestamp };
    chat.messages.push(newMessage);

    io.emit('receive_message', { chatId, message: newMessage, receiverId });

    // Send notification
    io.emit('notification', {
      type: 'message',
      recipientId: receiverId,
      message: 'You have a new message!'
    });
  });

  // Get chat history
  socket.on('get_chat_history', ({ userId, otherUserId }, callback) => {
    const chatId = [userId, otherUserId].sort().join('_');
    const chat = chats.find(c => c.id === chatId);
    callback(chat ? chat.messages : []);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Socket.io server running on http://localhost:${PORT}`);
});
