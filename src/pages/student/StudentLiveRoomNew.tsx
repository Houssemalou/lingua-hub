import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRoomById } from '@/data/mockData';
import { QuizModal } from '@/components/quiz/QuizModal';
import { getQuizForSession } from '@/data/quizzes';
import { LiveKitRoom } from '@/components/session/LiveKitRoom';

export default function StudentLiveRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const room = getRoomById(roomId || '');

  const [showQuiz, setShowQuiz] = useState(false);

  const quiz = getQuizForSession(roomId || '');

  const handleLeaveRoom = () => {
    if (quiz && !quiz.completed) {
      setShowQuiz(true);
    } else {
      navigate('/student/sessions');
    }
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Room not found</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/student/sessions')}>
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/student/sessions')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sessions
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{room.name}</h1>
              <p className="text-sm text-gray-600">{room.objective}</p>
            </div>
          </div>
        </div>
      </div>

      {/* LiveKit Room */}
      <div className="h-[calc(100vh-80px)]">
        <LiveKitRoom
          roomId={roomId || ''}
          onLeaveRoom={handleLeaveRoom}
        />
      </div>

      {/* Quiz Modal */}
      {quiz && (
        <QuizModal
          quiz={quiz}
          isOpen={showQuiz}
          onClose={() => {
            setShowQuiz(false);
            navigate('/student/sessions');
          }}
          onComplete={(score) => {
            console.log('Quiz completed with score:', score);
          }}
        />
      )}
    </motion.div>
  );
}