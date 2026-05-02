import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePrivileges } from '@/hooks/use-privileges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Shield, User, Mail, Calendar, Clock } from 'lucide-react';

interface HiveAdminUser {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  country?: string;
  websiteUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    totalMesas?: number;
    totalBookings?: number;
    totalPosts?: number;
  };
}

export default function HiveAdmin() {
  const { query } = useRouter();
  const userId = query.userId as string | undefined;
  const { user: currentUser } = useAuth();
  const { isSuperUser } = usePrivileges();
  const router = useRouter();
  const [targetUser, setTargetUser] = useState<HiveAdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch(`/api/hive-admin/${userId}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        if (!res.ok) throw new Error('Usuário não encontrado');
        const data = await res.json();
        setTargetUser(data.data || data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar usuário');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#662583]" />
      </div>
    );
  }

  if (error || !targetUser) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error || 'Usuário não encontrado'}</p>
        <Button variant="outline" onClick={() => router.push('/hive')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Hive
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.push('/hive')} className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#F7A731]" />
            <span className="text-[#F7A731] font-semibold">Hive Admin</span>
            {isSuperUser && <Badge className="bg-[#662583] text-white">Super Admin</Badge>}
          </div>
        </div>

        {/* User Profile Card */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#662583]/30 flex items-center justify-center text-2xl">
                {targetUser.avatarUrl ? (
                  <img src={targetUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-[#662583]" />
                )}
              </div>
              <div>
                <CardTitle className="text-white text-xl">
                  {targetUser.displayName || targetUser.name || 'Usuário'}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1 text-white/60 text-sm">
                  <span className="font-mono text-xs">{targetUser.id}</span>
                  <Badge variant="outline" className="border-[#F7A731] text-[#F7A731]">
                    {targetUser.role || 'user'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {targetUser.email && (
              <div className="flex items-center gap-2 text-white/70">
                <Mail className="h-4 w-4" />
                <span>{targetUser.email}</span>
              </div>
            )}
            {targetUser.createdAt && (
              <div className="flex items-center gap-2 text-white/70">
                <Calendar className="h-4 w-4" />
                <span>Criado em: {new Date(targetUser.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
            {targetUser.updatedAt && (
              <div className="flex items-center gap-2 text-white/70">
                <Clock className="h-4 w-4" />
                <span>Atualizado em: {new Date(targetUser.updatedAt).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/60 text-sm">Total de Mesas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#F7A731]">{targetUser.stats?.totalMesas || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/60 text-sm">Total de Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#F7A731]">{targetUser.stats?.totalBookings || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/60 text-sm">Total de Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#F7A731]">{targetUser.stats?.totalPosts || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Ações Administrativas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" className="border-[#662583] text-[#662583] hover:bg-[#662583]/20">
              Editar Perfil
            </Button>
            <Button variant="outline" className="border-[#D94367] text-[#D94367] hover:bg-[#D94367]/20">
              Suspender Usuário
            </Button>
            <Button variant="outline" className="border-[#2C8E8B] text-[#2C8E8B] hover:bg-[#2C8E8B]/20">
              Enviar Mensagem
            </Button>
            <Button variant="outline" className="border-[#F7A731] text-[#F7A731] hover:bg-[#F7A731]/20">
              Ver Histórico
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
