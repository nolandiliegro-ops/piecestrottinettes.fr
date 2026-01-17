import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Play, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

interface Tutorial {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  youtube_video_id: string;
  difficulty: number;
  duration_minutes: number;
  scooter_model_id: string | null;
  created_at: string;
  scooter?: {
    name: string;
    brand?: {
      name: string;
    } | null;
  } | null;
}

interface ScooterModel {
  id: string;
  name: string;
  brand: {
    name: string;
  } | null;
}

// Extract YouTube video ID from various URL formats
const extractYoutubeId = (input: string): string => {
  if (!input) return '';
  
  // Already a video ID (11 characters, alphanumeric with - and _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
    return input.trim();
  }
  
  // Standard YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  
  return input.trim();
};

// Generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

const difficultyLabels = ['Débutant', 'Facile', 'Intermédiaire', 'Avancé', 'Expert'];

const TutosManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    difficulty: 1,
    duration_minutes: 10,
    scooter_model_id: '',
  });

  // Fetch tutorials
  const { data: tutorials, isLoading } = useQuery({
    queryKey: ['admin-tutorials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutorials')
        .select('*, scooter:scooter_models(name, brand:brands(name))')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Tutorial[];
    }
  });

  // Fetch scooter models for selector
  const { data: scooterModels } = useQuery({
    queryKey: ['scooter-models-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scooter_models')
        .select('id, name, brand:brands(name)')
        .order('name');
      
      if (error) throw error;
      return data as ScooterModel[];
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const youtube_video_id = extractYoutubeId(data.youtube_url);
      const slug = generateSlug(data.title);
      
      const { error } = await supabase.from('tutorials').insert({
        title: data.title,
        slug,
        description: data.description || null,
        youtube_video_id,
        difficulty: data.difficulty,
        duration_minutes: data.duration_minutes,
        scooter_model_id: data.scooter_model_id || null,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      toast.success('Tutoriel créé avec succès');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const youtube_video_id = extractYoutubeId(data.youtube_url);
      const slug = generateSlug(data.title);
      
      const { error } = await supabase
        .from('tutorials')
        .update({
          title: data.title,
          slug,
          description: data.description || null,
          youtube_video_id,
          difficulty: data.difficulty,
          duration_minutes: data.duration_minutes,
          scooter_model_id: data.scooter_model_id || null,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      toast.success('Tutoriel mis à jour');
      resetForm();
      setEditingTutorial(null);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tutorials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      toast.success('Tutoriel supprimé');
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      youtube_url: '',
      difficulty: 1,
      duration_minutes: 10,
      scooter_model_id: '',
    });
  };

  const handleEdit = (tutorial: Tutorial) => {
    setEditingTutorial(tutorial);
    setFormData({
      title: tutorial.title,
      description: tutorial.description || '',
      youtube_url: tutorial.youtube_video_id,
      difficulty: tutorial.difficulty,
      duration_minutes: tutorial.duration_minutes,
      scooter_model_id: tutorial.scooter_model_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.youtube_url) {
      toast.error('Titre et URL YouTube requis');
      return;
    }
    
    if (editingTutorial) {
      updateMutation.mutate({ id: editingTutorial.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTutorial(null);
    resetForm();
  };

  const extractedVideoId = extractYoutubeId(formData.youtube_url);

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) handleDialogClose();
          else setIsDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-mineral hover:bg-mineral/90">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Tutoriel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTutorial ? 'Modifier le tutoriel' : 'Nouveau tutoriel'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Comment remplacer les freins..."
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Guide complet pour..."
                  rows={3}
                />
              </div>

              {/* YouTube URL - Smart Input */}
              <div className="space-y-2">
                <Label htmlFor="youtube_url">URL ou ID YouTube *</Label>
                <Input
                  id="youtube_url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=... ou dQw4w9WgXcQ"
                />
                {extractedVideoId && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">
                      ID extrait : <code className="text-mineral">{extractedVideoId}</code>
                    </p>
                    <div className="aspect-video rounded-lg overflow-hidden bg-carbon/10">
                      <img
                        src={`https://img.youtube.com/vi/${extractedVideoId}/maxresdefault.jpg`}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://img.youtube.com/vi/${extractedVideoId}/hqdefault.jpg`;
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Scooter Model */}
              <div className="space-y-2">
                <Label>Modèle de trottinette (optionnel)</Label>
                <Select 
                  value={formData.scooter_model_id || 'none'} 
                  onValueChange={(value) => setFormData({ ...formData, scooter_model_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun (tutoriel général)</SelectItem>
                    {scooterModels?.map((scooter) => (
                      <SelectItem key={scooter.id} value={scooter.id}>
                        {scooter.brand?.name} {scooter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-3">
                <Label>Difficulté : {difficultyLabels[formData.difficulty - 1]}</Label>
                <Slider
                  value={[formData.difficulty]}
                  onValueChange={([value]) => setFormData({ ...formData, difficulty: value })}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Débutant</span>
                  <span>Expert</span>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Durée (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={180}
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 10 })}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="bg-mineral hover:bg-mineral/90"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingTutorial ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tutorials Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Aperçu</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Modèle</TableHead>
              <TableHead className="text-center">Difficulté</TableHead>
              <TableHead className="text-center">Durée</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : tutorials?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucun tutoriel. Créez le premier !
                </TableCell>
              </TableRow>
            ) : (
              tutorials?.map((tutorial) => (
                <TableRow key={tutorial.id}>
                  <TableCell>
                    <div className="w-16 h-10 rounded overflow-hidden bg-muted relative group">
                      <img
                        src={`https://img.youtube.com/vi/${tutorial.youtube_video_id}/mqdefault.jpg`}
                        alt={tutorial.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-carbon/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium line-clamp-1">{tutorial.title}</p>
                      {tutorial.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {tutorial.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tutorial.scooter ? (
                      <span className="text-sm">
                        {tutorial.scooter.brand?.name} {tutorial.scooter.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Général</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm">{difficultyLabels[tutorial.difficulty - 1]}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm">{tutorial.duration_minutes} min</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                      >
                        <a
                          href={`https://youtube.com/watch?v=${tutorial.youtube_video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(tutorial)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(tutorial.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce tutoriel ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le tutoriel sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TutosManager;
