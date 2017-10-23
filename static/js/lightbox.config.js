;(function(){
  window.addEventListener('load', function(){
    if ( lightbox ) {
      const marginTop = 15
      const header = document.querySelector('#header')
      const headerHeight = parseInt(window.getComputedStyle(header, '').height.slice(0, -2), 10)
      const lightboxPosFromTop = headerHeight + marginTop
      
      lightbox.option({
        "alwaysShowNavOnTouchDevices": true,
        "fitImagesInViewport": true,
        "positionFromTop": lightboxPosFromTop,
        "wrapAround": true
      })
    }
  }, false)
})();