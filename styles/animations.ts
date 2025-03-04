import { Platform } from 'react-native';

export const keyframes = Platform.select({
  web: `
    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `,
  default: '',
});
