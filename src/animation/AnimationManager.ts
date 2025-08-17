import {
  Scene,
  Animation,
  AnimationGroup,
  TransformNode,
  Vector3,
  Quaternion,
  EasingFunction,
  CubicEase,
  CircleEase,
  QuadraticEase
} from '@babylonjs/core';

export class AnimationManager {
  private scene: Scene;
  private activeAnimations: Map<string, AnimationGroup> = new Map();
  
  constructor(scene: Scene) {
    this.scene = scene;
  }
  
  // Smooth position transition
  animatePosition(
    target: TransformNode,
    to: Vector3,
    duration: number = 1000,
    easeType: 'cubic' | 'circle' | 'quad' = 'cubic'
  ): AnimationGroup {
    const animationGroup = new AnimationGroup(`position_${Date.now()}`, this.scene);
    
    const positionAnimation = new Animation(
      'positionAnimation',
      'position',
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    const keys = [
      { frame: 0, value: target.position.clone() },
      { frame: (duration / 1000) * 60, value: to }
    ];
    
    positionAnimation.setKeys(keys);
    
    // Apply easing
    const easingFunction = this.getEasingFunction(easeType);
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    positionAnimation.setEasingFunction(easingFunction);
    
    animationGroup.addTargetedAnimation(positionAnimation, target);
    animationGroup.play();
    
    this.activeAnimations.set(`position_${target.name}`, animationGroup);
    
    return animationGroup;
  }
  
  // Smooth rotation transition
  animateRotation(
    target: TransformNode,
    to: Vector3,
    duration: number = 500,
    easeType: 'cubic' | 'circle' | 'quad' = 'quad'
  ): AnimationGroup {
    const animationGroup = new AnimationGroup(`rotation_${Date.now()}`, this.scene);
    
    const rotationAnimation = new Animation(
      'rotationAnimation',
      'rotation',
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    const keys = [
      { frame: 0, value: target.rotation.clone() },
      { frame: (duration / 1000) * 60, value: to }
    ];
    
    rotationAnimation.setKeys(keys);
    
    const easingFunction = this.getEasingFunction(easeType);
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    rotationAnimation.setEasingFunction(easingFunction);
    
    animationGroup.addTargetedAnimation(rotationAnimation, target);
    animationGroup.play();
    
    this.activeAnimations.set(`rotation_${target.name}`, animationGroup);
    
    return animationGroup;
  }
  
  // Smooth scale transition
  animateScale(
    target: TransformNode,
    to: Vector3,
    duration: number = 300,
    easeType: 'cubic' | 'circle' | 'quad' = 'cubic'
  ): AnimationGroup {
    const animationGroup = new AnimationGroup(`scale_${Date.now()}`, this.scene);
    
    const scaleAnimation = new Animation(
      'scaleAnimation',
      'scaling',
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    const keys = [
      { frame: 0, value: target.scaling.clone() },
      { frame: (duration / 1000) * 60, value: to }
    ];
    
    scaleAnimation.setKeys(keys);
    
    const easingFunction = this.getEasingFunction(easeType);
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    scaleAnimation.setEasingFunction(easingFunction);
    
    animationGroup.addTargetedAnimation(scaleAnimation, target);
    animationGroup.play();
    
    this.activeAnimations.set(`scale_${target.name}`, animationGroup);
    
    return animationGroup;
  }
  
  // Pulse effect for interaction feedback
  pulse(
    target: TransformNode,
    intensity: number = 1.2,
    duration: number = 200
  ): void {
    const originalScale = target.scaling.clone();
    const pulseScale = originalScale.scale(intensity);
    
    this.animateScale(target, pulseScale, duration / 2, 'circle').onAnimationGroupEndObservable.add(() => {
      this.animateScale(target, originalScale, duration / 2, 'circle');
    });
  }
  
  // Bounce effect
  bounce(
    target: TransformNode,
    height: number = 1,
    duration: number = 500
  ): void {
    const animationGroup = new AnimationGroup(`bounce_${Date.now()}`, this.scene);
    
    const bounceAnimation = new Animation(
      'bounceAnimation',
      'position.y',
      60,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    const originalY = target.position.y;
    const frames = (duration / 1000) * 60;
    
    const keys = [
      { frame: 0, value: originalY },
      { frame: frames * 0.3, value: originalY + height },
      { frame: frames * 0.6, value: originalY + height * 0.3 },
      { frame: frames * 0.8, value: originalY + height * 0.1 },
      { frame: frames, value: originalY }
    ];
    
    bounceAnimation.setKeys(keys);
    
    const easingFunction = new QuadraticEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
    bounceAnimation.setEasingFunction(easingFunction);
    
    animationGroup.addTargetedAnimation(bounceAnimation, target);
    animationGroup.play();
  }
  
  // Shake effect for impacts or errors
  shake(
    target: TransformNode,
    intensity: number = 0.1,
    duration: number = 300
  ): void {
    const originalPosition = target.position.clone();
    const shakeFrames = 10;
    const frameDuration = duration / shakeFrames;
    
    let currentFrame = 0;
    const shakeInterval = setInterval(() => {
      if (currentFrame >= shakeFrames) {
        clearInterval(shakeInterval);
        target.position = originalPosition;
        return;
      }
      
      target.position = originalPosition.add(
        new Vector3(
          (Math.random() - 0.5) * intensity,
          (Math.random() - 0.5) * intensity,
          (Math.random() - 0.5) * intensity
        )
      );
      
      currentFrame++;
    }, frameDuration);
  }
  
  // Fade in/out using visibility
  fade(
    target: TransformNode,
    toAlpha: number,
    duration: number = 1000
  ): AnimationGroup {
    const animationGroup = new AnimationGroup(`fade_${Date.now()}`, this.scene);
    
    const fadeAnimation = new Animation(
      'fadeAnimation',
      'visibility',
      60,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    const keys = [
      { frame: 0, value: target.visibility || 1 },
      { frame: (duration / 1000) * 60, value: toAlpha }
    ];
    
    fadeAnimation.setKeys(keys);
    
    const easingFunction = new CubicEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    fadeAnimation.setEasingFunction(easingFunction);
    
    animationGroup.addTargetedAnimation(fadeAnimation, target);
    animationGroup.play();
    
    return animationGroup;
  }
  
  private getEasingFunction(type: 'cubic' | 'circle' | 'quad'): EasingFunction {
    switch (type) {
      case 'cubic':
        return new CubicEase();
      case 'circle':
        return new CircleEase();
      case 'quad':
        return new QuadraticEase();
      default:
        return new CubicEase();
    }
  }
  
  stopAnimation(name: string): void {
    const animation = this.activeAnimations.get(name);
    if (animation) {
      animation.stop();
      this.activeAnimations.delete(name);
    }
  }
  
  stopAllAnimations(): void {
    this.activeAnimations.forEach(animation => animation.stop());
    this.activeAnimations.clear();
  }
  
  dispose(): void {
    this.stopAllAnimations();
  }
}