import React, { FC } from 'react';

interface SpacerProps {
  marginTop?: string | number;
  marginBottom?: string | number;
  marginLeft?: string | number;
  marginRight?: string | number;
}

const Spacer: FC<SpacerProps> = (props) => {
  return (
    <div 
        style={{marginTop: props.marginTop,
                marginBottom : props.marginBottom,
                marginLeft: props.marginLeft,
                marginRight: props.marginRight }}>
      
    </div>
  )
}

export default Spacer;