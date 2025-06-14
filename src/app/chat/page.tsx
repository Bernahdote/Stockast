import Chat from '../components/Chat';

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          AI Chat with Voice
        </h1>
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <Chat />
        </div>
      </div>
    </main>
  );
} 