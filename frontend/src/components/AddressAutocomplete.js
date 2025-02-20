import React, { useEffect, useRef } from 'react';

export default function AddressAutocomplete({ onSelect, placeholder, className }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!window.google) {
      console.error('Google Maps JavaScript API não está carregada');
      return;
    }

    // Inicializa o autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: 'BR' },
        fields: ['address_components', 'geometry', 'name', 'formatted_address'],
      }
    );

    // Adiciona listener para quando um lugar é selecionado
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      
      if (!place.geometry) {
        console.log('Nenhum local encontrado');
        return;
      }

      const addressData = {
        address: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };

      onSelect(addressData);
    });

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className={className}
    />
  );
} 