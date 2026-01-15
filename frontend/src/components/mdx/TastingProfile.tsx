'use client';

interface TastingProfileProps {
  body: 'light' | 'medium' | 'full';
  tannins?: 'low' | 'medium' | 'high';
  acidity: 'low' | 'medium' | 'high';
  sweetness: 'dry' | 'off-dry' | 'sweet';
  aromas?: string[];
  flavors?: string[];
}

export function TastingProfile({
  body,
  tannins,
  acidity,
  sweetness,
  aromas = [],
  flavors = [],
}: TastingProfileProps) {
  const levelToValue = (level: string): number => {
    switch (level) {
      case 'light':
      case 'low':
      case 'dry':
        return 33;
      case 'medium':
      case 'off-dry':
        return 66;
      case 'full':
      case 'high':
      case 'sweet':
        return 100;
      default:
        return 50;
    }
  };

  const ProfileBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-wine-300">{label}</span>
        <span className="text-wine-400">
          {value <= 33 ? 'Low' : value <= 66 ? 'Medium' : 'High'}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-wine-700">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="rounded-xl bg-wine-800/50 p-6 backdrop-blur">
      <h3 className="mb-4 font-serif text-lg font-semibold text-gold-300">Tasting Profile</h3>

      {/* Profile bars */}
      <div className="mb-6">
        <ProfileBar label="Body" value={levelToValue(body)} color="bg-gradient-to-r from-wine-500 to-wine-300" />
        {tannins && (
          <ProfileBar label="Tannins" value={levelToValue(tannins)} color="bg-gradient-to-r from-purple-500 to-purple-300" />
        )}
        <ProfileBar label="Acidity" value={levelToValue(acidity)} color="bg-gradient-to-r from-yellow-500 to-yellow-300" />
        <ProfileBar label="Sweetness" value={levelToValue(sweetness)} color="bg-gradient-to-r from-pink-500 to-pink-300" />
      </div>

      {/* Aromas */}
      {aromas.length > 0 && (
        <div className="mb-4">
          <span className="mb-2 block text-sm text-wine-400">Aromas</span>
          <div className="flex flex-wrap gap-2">
            {aromas.map((aroma) => (
              <span
                key={aroma}
                className="rounded-full bg-wine-700/50 px-3 py-1 text-xs text-wine-200"
              >
                {aroma}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Flavors */}
      {flavors.length > 0 && (
        <div>
          <span className="mb-2 block text-sm text-wine-400">Flavors</span>
          <div className="flex flex-wrap gap-2">
            {flavors.map((flavor) => (
              <span
                key={flavor}
                className="rounded-full bg-gold-500/20 px-3 py-1 text-xs text-gold-300"
              >
                {flavor}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
