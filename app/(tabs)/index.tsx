import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function Index() {
  const lastVisitedTab = useSelector((state: RootState) => state.settings?.lastVisitedTab) || 'pantry-list';
  return <Redirect href={`/${lastVisitedTab}`} />;
}
