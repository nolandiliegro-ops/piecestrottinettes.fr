import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Upload, Check, X, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Part {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  category: { name: string } | null;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('id, name, slug, image_url, category:categories(name)')
        .order('name');

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
      toast.error('Erreur lors du chargement des pièces');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (partId: string, partSlug: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setUploading(partId);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${partSlug}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('part-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('part-images')
        .getPublicUrl(filePath);

      // Update part in database
      const { error: updateError } = await supabase
        .from('parts')
        .update({ image_url: publicUrl })
        .eq('id', partId);

      if (updateError) throw updateError;

      // Update local state
      setParts(prev => prev.map(p => 
        p.id === partId ? { ...p, image_url: publicUrl } : p
      ));

      toast.success('Image mise à jour avec succès');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Erreur lors de l'upload de l'image");
    } finally {
      setUploading(null);
    }
  };

  const isPlaceholder = (url: string | null) => {
    return !url || url.includes('placehold.co') || url.includes('placeholder');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-greige flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-garage" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-greige">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-carbon">Administration</h1>
            <p className="text-carbon/60">Gestion des images des pièces</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Images des pièces
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({parts.filter(p => !isPlaceholder(p.image_url)).length}/{parts.length} avec image)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-garage" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Image</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="w-32">Statut</TableHead>
                    <TableHead className="w-48">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell>
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          {part.image_url && !isPlaceholder(part.image_url) ? (
                            <img 
                              src={part.image_url} 
                              alt={part.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{part.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {part.category?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {isPlaceholder(part.image_url) ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 text-sm">
                            <X className="w-4 h-4" />
                            Placeholder
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                            <Check className="w-4 h-4" />
                            Image réelle
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(part.id, part.slug, file);
                            }}
                            disabled={uploading === part.id}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={uploading === part.id}
                            className="w-full"
                          >
                            {uploading === part.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            {uploading === part.id ? 'Upload...' : 'Choisir image'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
