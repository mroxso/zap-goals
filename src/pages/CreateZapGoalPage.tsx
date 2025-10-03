import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Image as ImageIcon, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCreateZapGoal } from '@/hooks/useCreateZapGoal';
import { useUploadFile } from '@/hooks/useUploadFile';

export function CreateZapGoalPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { mutateAsync: createGoal, isPending: isCreating } = useCreateZapGoal();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();

  const [formData, setFormData] = useState({
    summary: '',
    content: '',
    amountSats: '',
    image: '',
    closedAt: '',
    relays: 'wss://relay.damus.io\nwss://relay.nostr.band\nwss://nos.lol\nwss://relay.primal.net',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  if (!user) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-2xl text-center">
        <h2 className="text-2xl font-bold mb-4">Login Required</h2>
        <p className="text-muted-foreground mb-8">
          You must be logged in to create a zap goal.
        </p>
        <Button asChild>
          <Link to="/goals">Browse Goals</Link>
        </Button>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.summary.trim()) {
      toast({
        title: 'Missing title',
        description: 'Please provide a title for your goal.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: 'Missing description',
        description: 'Please provide a description for your goal.',
        variant: 'destructive',
      });
      return;
    }

    const amountSats = parseInt(formData.amountSats);
    if (!amountSats || amountSats <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please provide a valid target amount in sats.',
        variant: 'destructive',
      });
      return;
    }

    try {
      let imageUrl = formData.image;

      // Upload image if file is selected
      if (imageFile) {
        const [[_, url]] = await uploadFile(imageFile);
        imageUrl = url;
      }

      // Parse relays
      const relays = formData.relays
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.startsWith('wss://') || r.startsWith('ws://'));

      if (relays.length === 0) {
        toast({
          title: 'Invalid relays',
          description: 'Please provide at least one valid relay URL.',
          variant: 'destructive',
        });
        return;
      }

      // Parse closed_at timestamp
      let closedAt: number | undefined;
      if (formData.closedAt) {
        closedAt = Math.floor(new Date(formData.closedAt).getTime() / 1000);
      }

      const event = await createGoal({
        summary: formData.summary,
        content: formData.content,
        amountSats,
        image: imageUrl || undefined,
        closedAt,
        relays,
      });

      toast({
        title: 'Goal created!',
        description: 'Your zap goal has been published to Nostr.',
      });

      navigate(`/goals/${event.id}`);
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isSubmitting = isCreating || isUploading;

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link to="/goals">← Back to Goals</Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Create Zap Goal</h1>
        <p className="text-muted-foreground">
          Start a fundraising campaign on Nostr powered by Lightning Network
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Goal Details</CardTitle>
            <CardDescription>
              Provide information about your fundraising goal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="summary">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="summary"
                placeholder="e.g., Nostrasia Travel Expenses"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                A short, catchy title for your goal
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                placeholder="Explain what you're raising funds for and how they will be used..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Provide details about your goal to help supporters understand your cause
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amountSats">
                Target Amount (sats) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amountSats"
                  type="number"
                  placeholder="21000"
                  className="pl-10"
                  value={formData.amountSats}
                  onChange={(e) => setFormData({ ...formData, amountSats: e.target.value })}
                  required
                  min="1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The fundraising target in satoshis (1 sat = 0.00000001 BTC)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optional Settings</CardTitle>
            <CardDescription>
              Add an image, set a deadline, and configure relays
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <div className="space-y-3">
                {imagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <Input
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <p className="text-xs text-muted-foreground">Or provide a URL:</p>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="image"
                    placeholder="https://example.com/image.jpg"
                    className="pl-10"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closedAt">Closing Date (Optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="closedAt"
                  type="datetime-local"
                  className="pl-10"
                  value={formData.closedAt}
                  onChange={(e) => setFormData({ ...formData, closedAt: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Set a deadline for when the goal closes (zaps after this date won't count)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relays">Relay URLs</Label>
              <Textarea
                id="relays"
                placeholder="wss://relay.damus.io&#10;wss://relay.nostr.band"
                value={formData.relays}
                onChange={(e) => setFormData({ ...formData, relays: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                One relay URL per line. Zaps will be tallied from these relays.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/goals')}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Creating...' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </div>
  );
}
