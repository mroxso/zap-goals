import { nip19 } from 'nostr-tools';
import { useParams } from 'react-router-dom';
import NotFound from './NotFound';
import { ProfileView } from '@/components/ProfileView';
import { NoteView } from '@/components/NoteView';
import { EventView } from '@/components/EventView';
import { AddressableEventView } from '@/components/AddressableEventView';

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  if (!identifier) {
    return <NotFound />;
  }

  let decoded;
  try {
    decoded = nip19.decode(identifier);
  } catch {
    return <NotFound />;
  }

  const { type, data } = decoded;

  switch (type) {
    case 'npub':
      return <ProfileView pubkey={data} />;

    case 'nprofile':
      return <ProfileView pubkey={data.pubkey} />;

    case 'note':
      return <NoteView eventId={data} />;

    case 'nevent':
      return <EventView eventId={data.id} />;

    case 'naddr':
      return <AddressableEventView 
        kind={data.kind} 
        pubkey={data.pubkey} 
        identifier={data.identifier} 
      />;

    default:
      return <NotFound />;
  }
} 