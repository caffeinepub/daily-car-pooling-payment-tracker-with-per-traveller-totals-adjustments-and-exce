import { useState } from 'react';
import { useLedgerState } from './LedgerStateContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import { Users } from 'lucide-react';

export default function TravellerManager() {
  const { travellers, addTraveller, removeTraveller, renameTraveller } = useLedgerState();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = () => {
    if (newName.trim()) {
      addTraveller(newName.trim());
      setNewName('');
    }
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      renameTraveller(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Travellers</CardTitle>
        <CardDescription>Manage who uses the carpool</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new traveller */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} size="icon" disabled={!newName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Traveller list */}
        {travellers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No travellers yet"
            description="Add your first traveller to get started"
          />
        ) : (
          <div className="space-y-2">
            {travellers.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
              >
                {editingId === t.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button onClick={saveEdit} size="icon" variant="ghost">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button onClick={cancelEdit} size="icon" variant="ghost">
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{t.name}</span>
                    <Button
                      onClick={() => startEdit(t.id, t.name)}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => removeTraveller(t.id)}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
