import { useState, useEffect } from 'react';

function useDelayedState<T>(initialValue: T, delayMs: number): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [actualState, setActualState] = useState<T>(initialValue);
  const [displayState, setDisplayState] = useState<T>(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayState(actualState);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [actualState, delayMs]);

  return [displayState, setActualState];
}

export default useDelayedState;