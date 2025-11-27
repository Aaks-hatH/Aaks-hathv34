import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';

export default function MessageBoard() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['guestbook'],
    queryFn: () => base44.entities.GuestbookMessage.list('-created_date', 20),
  });

  const addMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.GuestbookMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guestbook'] });
      setName("");
      setMessage("");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    addMessageMutation.mutate({ name: name.trim(), message: message.trim() });
  };

  return (
    <section className="relative z-10 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-mono font-bold text-center mb-8"
        >
          <span className="text-cyan-500">#</span>
          <span className="text-slate-100"> Leave a message!</span>
        </motion.h2>

        {/* Message Form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8"
        >
          <div className="space-y-4">
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-900/50 border-slate-600 text-slate-200 placeholder:text-slate-500"
              maxLength={30}
            />
            <Textarea
              placeholder="Your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-slate-900/50 border-slate-600 text-slate-200 placeholder:text-slate-500 min-h-[80px]"
              maxLength={200}
            />
            <Button 
              type="submit" 
              disabled={addMessageMutation.isPending || !name.trim() || !message.trim()}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              {addMessageMutation.isPending ? 'Sending...' : 'Add'}
            </Button>
          </div>
        </motion.form>

        {/* Messages List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <p className="text-slate-500 text-center">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-slate-500 text-center">No messages yet. Be the first!</p>
          ) : (
            messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-cyan-400 font-semibold">{msg.name}</span>
                  <span className="text-slate-500 text-xs">
                    {moment(msg.created_date).format('YYYY-MM-DD HH:mm')}
                  </span>
                </div>
                <p className="text-slate-300 text-sm">{msg.message}</p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}