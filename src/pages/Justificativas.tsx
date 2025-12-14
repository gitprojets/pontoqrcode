import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  Upload,
  Calendar,
  Loader2,
  Download,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Justificativa {
  id: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  descricao: string | null;
  anexo_path: string | null;
  anexo_nome: string | null;
  created_at: string;
}

const tipoLabels: Record<string, string> = {
  medico: 'Atestado Médico',
  oficial: 'Compromisso Oficial',
  treinamento: 'Treinamento',
  outro: 'Outro',
};

const statusConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  pendente: {
    icon: Clock,
    label: 'Pendente',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  aprovado: {
    icon: CheckCircle,
    label: 'Aprovado',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  rejeitado: {
    icon: XCircle,
    label: 'Rejeitado',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
};

export default function Justificativas() {
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justificativas, setJustificativas] = useState<Justificativa[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    tipo: 'medico',
    dataInicio: '',
    dataFim: '',
    descricao: '',
  });

  useEffect(() => {
    fetchJustificativas();
  }, [profile]);

  const fetchJustificativas = async () => {
    if (!profile?.id) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('justificativas')
        .select('*')
        .eq('professor_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJustificativas(data || []);
    } catch (error) {
      console.error('Error fetching justificativas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não permitido. Use PDF, JPG ou PNG.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id || !profile?.unidade_id) {
      toast.error('Você precisa estar vinculado a uma unidade');
      return;
    }

    if (!formData.dataInicio || !formData.dataFim) {
      toast.error('Preencha as datas');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let anexoPath = null;
      let anexoNome = null;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('justificativas')
          .upload(filePath, selectedFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Erro ao fazer upload do arquivo');
          setIsSubmitting(false);
          return;
        }

        anexoPath = filePath;
        anexoNome = selectedFile.name;
      }

      // Create justificativa record
      const { error } = await supabase
        .from('justificativas')
        .insert({
          professor_id: profile.id,
          unidade_id: profile.unidade_id,
          tipo: formData.tipo,
          data_inicio: formData.dataInicio,
          data_fim: formData.dataFim,
          descricao: formData.descricao || null,
          anexo_path: anexoPath,
          anexo_nome: anexoNome,
        });

      if (error) throw error;

      toast.success('Justificativa enviada com sucesso!');
      setShowForm(false);
      resetForm();
      fetchJustificativas();
    } catch (error: any) {
      console.error('Error creating justificativa:', error);
      toast.error('Erro ao enviar justificativa: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'medico',
      dataInicio: '',
      dataFim: '',
      descricao: '',
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadAnexo = async (path: string, nome: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('justificativas')
        .download(path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = nome;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Justificativas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus atestados e justificativas de ausência
            </p>
          </div>
          
          <Button variant="gradient" className="gap-2" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" />
            Nova Justificativa
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card-elevated p-6 animate-slide-up">
            <h2 className="text-lg font-display font-semibold text-foreground mb-6">
              Enviar Justificativa
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tipo</label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medico">Atestado Médico</SelectItem>
                      <SelectItem value="oficial">Compromisso Oficial</SelectItem>
                      <SelectItem value="treinamento">Treinamento</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Anexo (PDF, JPG, PNG - máx 5MB)
                  </label>
                  <div className="flex gap-2">
                    <Input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      className="flex-1 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary" 
                      onChange={handleFileChange}
                    />
                    {selectedFile && (
                      <div className="flex items-center text-xs text-success">
                        <Paperclip className="w-3 h-3 mr-1" />
                        {selectedFile.name.slice(0, 15)}...
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Data Início *</label>
                  <Input 
                    type="date" 
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Data Fim *</label>
                  <Input 
                    type="date" 
                    value={formData.dataFim}
                    onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Descrição</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-foreground resize-none"
                  placeholder="Descreva o motivo da ausência..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button type="submit" variant="gradient" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Enviar Justificativa'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="card-elevated p-6 animate-slide-up">
          <h2 className="text-lg font-display font-semibold text-foreground mb-6">
            Minhas Justificativas
          </h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : justificativas.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma justificativa enviada</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {justificativas.map((item) => {
                  const config = statusConfig[item.status] || statusConfig.pendente;
                  const StatusIcon = config.icon;
                  
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-muted/50 rounded-xl"
                    >
                      <div className={cn('p-3 rounded-lg self-start', config.bg)}>
                        <FileText className={cn('w-5 h-5', config.color)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">
                            {tipoLabels[item.tipo] || item.tipo}
                          </p>
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            config.bg,
                            config.color
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.descricao || 'Sem descrição'}
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:items-end gap-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(item.data_inicio)}</span>
                          {item.data_inicio !== item.data_fim && (
                            <span>- {formatDate(item.data_fim)}</span>
                          )}
                        </div>
                        {item.anexo_path && item.anexo_nome && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-primary"
                            onClick={() => downloadAnexo(item.anexo_path!, item.anexo_nome!)}
                          >
                            <Download className="w-3 h-3" />
                            {item.anexo_nome.slice(0, 20)}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </MainLayout>
  );
}