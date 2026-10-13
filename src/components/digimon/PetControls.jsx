const labels = { feed: 'Feed', train: 'Train', rest: 'Rest', pet: 'Pet' };
const icons = { feed: '◒', train: '↗', rest: '☾', pet: '♡' };
export function PetControls({ pet, now, onAction, paused }) {
  return <div className="digimon-controls" role="group" aria-label="Care for your Digimon">
    {['feed', 'train', 'rest', 'pet'].map(action => {
      const cooldown = (pet.cooldowns[action] || 0) > now;
      const resting = pet.activity === 'rest';
      const busy = pet.activity !== 'idle' && !(resting && action === 'rest');
      const disabled = paused || busy || cooldown || (action === 'train' && (pet.energy < 15 || pet.food < 10));
      return <button type="button" key={action} onClick={() => onAction(action)} disabled={disabled} aria-label={resting && action === 'rest' ? 'Wake' : labels[action]} title={cooldown ? 'A short breather before doing that again.' : undefined}><span aria-hidden="true">{icons[action]}</span>{resting && action === 'rest' ? 'Wake' : labels[action]}</button>;
    })}
  </div>;
}
