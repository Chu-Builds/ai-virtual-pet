import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Pet } from '@/lib/petTypes';
import { generatePetResponse, generatePersonalitySummary } from '@/lib/petAI';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTotalInteractions(pets: Pet[]): number {
  return pets
    .filter(p => !('_isCoparent' in p))  // owned pets only when called externally
    .reduce((sum, p) => sum + (p.interaction_count || 0), 0);
}

export function getSlotLimit(totalInteractions: number): number {
  if (totalInteractions >= 60) return 3;
  if (totalInteractions >= 30) return 2;
  return 1;
}

// ─── Fetch all pets the current user owns or co-parents ───────────────────────

export function useMyPets() {
  return useQuery<Pet[]>({
    queryKey: ['my-pets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .or('owner_id.eq.' + user.id + ',coparent_id.eq.' + user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as Pet[]) || [];
    },
  });
}

// ─── Active pet (used by home, journal, stats) ────────────────────────────────

export function useActivePet() {
  return useQuery<Pet | null>({
    queryKey: ['active-pet'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // 1. Try to get active_pet_id from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_pet_id')
        .eq('id', user.id)
        .single();

      const activePetId = profile?.active_pet_id;

      // 2. If we have an active_pet_id, fetch that pet
      if (activePetId) {
        const { data: activePet, error } = await supabase
          .from('pets')
          .select('*')
          .eq('id', activePetId)
          .maybeSingle();
        if (!error && activePet) return activePet as Pet;
      }

      // 3. Fallback: return the first pet the user owns/coparents
      const { data: firstPet, error: petError } = await supabase
        .from('pets')
        .select('*')
        .or('owner_id.eq.' + user.id + ',coparent_id.eq.' + user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (petError) throw petError;
      return firstPet as Pet | null;
    },
  });

  const pet = query.data;

  useEffect(() => {
    const petId = pet?.id;
    if (!petId) return;
    
    console.log('[Realtime] Setting up channel for pet:', petId);
    
    const channel = supabase
      .channel('pet-sync-' + petId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pets',
        filter: 'id=eq.' + petId
      }, (payload) => {
        console.log('[Realtime] Change received:', payload.eventType);
        queryClient.invalidateQueries({ queryKey: ['active-pet'] });
        queryClient.invalidateQueries({ queryKey: ['my-pets'] });
      })
      .subscribe((status) => {
        console.log('[Realtime] Status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pet?.id, queryClient]);

  return query;
}

// ─── Alias so existing screens that import useMyPet() still work ──────────────
export const useMyPet = useActivePet;

// ─── Set active pet ───────────────────────────────────────────────────────────

export function useSetActivePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (petId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ active_pet_id: petId })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-pet'] });
      queryClient.invalidateQueries({ queryKey: ['my-pet'] });
    },
  });
}

// ─── Pet actions ──────────────────────────────────────────────────────────────

export function usePetActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['active-pet'] });
    queryClient.invalidateQueries({ queryKey: ['my-pet'] });
    queryClient.invalidateQueries({ queryKey: ['my-pets'] });
  };

  const feedPet = async (petId: string) => {
    const { data: pet } = await supabase.from('pets').select('hunger, energy').eq('id', petId).single();
    if (!pet) return;

    const newHunger = Math.min((pet.hunger || 0) + 30, 100);
    const newEnergy = Math.min((pet.energy || 0) + 10, 100);
    const { error } = await supabase
      .from('pets')
      .update({
        hunger: newHunger,
        energy: newEnergy,
        last_interaction_at: new Date().toISOString()
      })
      .eq('id', petId);

    if (error) throw error;
    invalidate();
  };

  const playWithPet = async (petId: string) => {
    const { data: pet } = await supabase.from('pets').select('energy, affection, hunger').eq('id', petId).single();
    if (!pet) return;

    const newEnergy = Math.max((pet.energy || 0) - 15, 0);
    const newAffection = Math.min((pet.affection || 0) + 20, 100);
    const newHunger = Math.max((pet.hunger || 0) - 10, 0);

    const { error } = await supabase
      .from('pets')
      .update({
        energy: newEnergy,
        affection: newAffection,
        hunger: newHunger,
        last_interaction_at: new Date().toISOString()
      })
      .eq('id', petId);

    if (error) throw error;
    invalidate();
  };

  const talkToPet = async (petId: string, message: string): Promise<string> => {
    const { data } = await supabase.from('pets').select('*').eq('id', petId).single();
    if (!data) throw new Error('Pet not found');
    const pet = data as Pet;

    const aiResult = await generatePetResponse(pet, message);

    const newMemory = { summary: aiResult.memorySummary, timestamp: new Date().toISOString() };
    const updatedMemory = [newMemory, ...(pet.memory || [])].slice(0, 20);

    const newInteractionCount = (pet.interaction_count || 0) + 1;
    let newPersonalitySummary = pet.personality_summary;

    if (newInteractionCount % 5 === 0) {
      newPersonalitySummary = await generatePersonalitySummary(updatedMemory);
    }

    const { error } = await supabase
      .from('pets')
      .update({
        memory: updatedMemory,
        interaction_count: newInteractionCount,
        personality_summary: newPersonalitySummary,
        last_interaction_at: new Date().toISOString()
      })
      .eq('id', petId);

    if (error) throw error;
    invalidate();

    return aiResult.response;
  };

  const applyStatDecay = async (pet: Pet) => {
    const lastInteraction = new Date(pet.last_interaction_at).getTime();
    const now = new Date().getTime();
    const hours = (now - lastInteraction) / (1000 * 60 * 60);

    if (hours <= 0) return;

    const newEnergy = hours >= 8 ? 80 : pet.energy;
    const newAffection = Math.max(0, pet.affection - Math.floor(hours * 3));
    const newHunger = Math.max(0, pet.hunger - Math.floor(hours * 5));

    console.log('[applyStatDecay] hours elapsed:', hours.toFixed(2));
    console.log('[applyStatDecay] energy:', pet.energy, '->', newEnergy);
    console.log('[applyStatDecay] affection:', pet.affection, '->', newAffection);
    console.log('[applyStatDecay] hunger:', pet.hunger, '->', newHunger);

    if (newEnergy === pet.energy && newAffection === pet.affection && newHunger === pet.hunger) {
      console.log('[applyStatDecay] No change detected, skipping update');
      return;
    }

    const { error } = await supabase
      .from('pets')
      .update({
        energy: newEnergy,
        affection: newAffection,
        hunger: newHunger,
      })
      .eq('id', pet.id);

    if (error) throw error;
    invalidate();
  };

  const releasePet = async (petId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: pet } = await supabase.from('pets').select('owner_id').eq('id', petId).single();
    if (!pet) throw new Error('Pet not found');

    if (pet.owner_id === user.id) {
      // Owner: delete the pet entirely
      const { error } = await supabase.from('pets').delete().eq('id', petId);
      if (error) throw error;
    } else {
      // Co-parent: just remove self
      const { error } = await supabase.from('pets').update({ coparent_id: null }).eq('id', petId);
      if (error) throw error;
    }

    // Clear active pet if it was this one
    await supabase
      .from('profiles')
      .update({ active_pet_id: null })
      .eq('id', user.id)
      .eq('active_pet_id', petId);

    invalidate();
  };

  return { feedPet, playWithPet, talkToPet, applyStatDecay, releasePet };
}
