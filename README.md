# svelte-awesome-pug
Using the [Svelte Preprocessor to process Pug](https://github.com/sveltejs/svelte-preprocess/blob/main/docs/preprocessing.md#pug)  can look a bit funky.

svelte-awesome-pug unfunkies it in a good way. [Here's a video](https://youtu.be/em1i-D7IpD4?t=19) showcasing the ease of use working with svelte-awesome-pug

Plans
- [Maybe create a language server extension](https://github.com/Refzlund/svelte-awesome-pug#maybe-create-a-language-server-extension)
- [Allow Svelte statements {#if ...} and {@const ...} in a "non-recursively-indented way" (unlike +if(...))](https://github.com/Refzlund/svelte-awesome-pug#allow-svelte-statements-if--in-a-non-recursively-indented-way-unlike-if)

## Install

```
npm i -D svelte-awesome-pug
```

Wrap the svelte preprocessor with the awesome-pug pre and post processors 

```ts
import { awesomePugPre, awesomePugPost } from 'svelte-awesome-pug'

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: [
        awesomePugPre,
        preprocess(),
        awesomePugPost
    ],
```

## Incompatibility
I'm a [TAB] kind of guy, so I haven't supported (or thought of) space indentation yet. The code is pretty simple so feel free to make a pull-request! Take a look at [awesome-pug-pre.js](https://github.com/Refzlund/svelte-awesome-pug/blob/master/src/lib/awesome-pug-pre.js)

## Key features

Is compatible with old-style pug. So any existing pug code shouldn't break.

### No need for != and quotes
```pug
    //- pug
    .some-div(on:click!='{() => ...}')
```
```pug
    //- awesome-pug
    .some-div(on:click={() => ...})
```

### Indented components
```pug
    //- Without awesome-pug
    Input.Text()
    //- Becomes  <Input class="Text">
```
```pug
    //- With awesome-pug
    Input.Text()
    // Becomes   <Input.Text>
```

### Spreading objects
```pug
    .some-div('{...$$restProps}')
    //         ^ ts(-1) error
```
```pug
    .some-div(...$$restProps)
    // Results in <div class="some-div" {...$$restProps}>
```

## More
Okay, so making pug not look like 💩 is great. Now ... here are some personal additions of functionality (like them or not)

### `export:`
Export will export/(forward) the attribute for you. Like on:click forwards events, export:class will allow the component to retrieve the `class` attribute:

```pug
    //- Component.svelte
    .some-div(export:class)
```
```pug
    Component.another-class
```

The attribute input will be default value. (With an exception of `export:class` and `export:style` which will always have the default value of `''` if you don't provide any)

So..
```pug
    //- Component.svelte
    Table(export:data)
    //- Becomes    let __export_data__

    ...
    
    Component
    //- Component was created without the export `data`
    
    


    //- Component.svelte
    Table(export:data={undefined})
    //- Becomes    let __export_data__ = undefined

    ...
    
    Component
```

#### Exporting strings
There are two ways to deal with exported strings:
```pug
    Table(export:header='Some header')
	//- Becomes    
	//-            let __export_header__ = ''
	//-            Table(header='Some header {__export_header__}')

	Table(export:header={'Some header'})
    //- Becomes    
	//-            let __export_header__ = 'Some header'
	//-            Table(header!='{__export_header__}')
```

### `style:` and `class:` directives
You can't normally do
```pug
    Component(class:active class:somebool)
    //- "Can't use class directive on components"
```

However, with ***svelte-awesome-pug*** we can add a space in-between AND have multiple like so:
```pug
    Component(class :active :somebool)
    //- Becomes   <Component class="{active ? 'active' : ''}  {somebool ? 'somebool' : ''}">

    Component(class :enabled={isEnabled})
    //- Becomes   <Component class="{isEnabled ? 'enabled' : ''}>
```

Same with style! (or should I say... IN STYLE🕺✨)
```pug
    Component(
        export:style
            :--some-variable="{wawiable}px"
            :margin="10px"
    )
```

### --variables
Speaking of style. You can assign CSS variables directly as attributes
```pug
    #some-div(
        --some-variable="{wariable}px"
    )
```

~~my cat is snoring loudly~~

### svelte:fragment shortcut
If you wanna skip writing the whole damn fragmentely sveltery text, you can just
```pug
    Component
        (slot="Some named slot")
            .some-div
    
    //- Becomes <svelte:fragment slot="Some named slot">...
```

### Wraps `true`, `false`, `numbers`, `arrays` into `{ }`
```pug
    div(
        some-bool=true
        another-bool=false
        some-num=123.23
        some-array=[1, 2, 3]
    )

    //- Becomes   
        <div  
            some-bool={true}
            another-bool={false}
            some-num={123.23}
            some-array={[1, 2, 3]}
        >
```

### You can comment out attributes
It removes the assigned value and indented items (relative to the commented part). 
```pug
    .some-div(
        //- some-attribute={() => {
            ...
        }}
        another-attribute={...}
        //- export:class
            :some
            :class
    )

    //- Becomes  <div class="some-div" another-attribute={...}>
```

## Footnotes

### Maybe create a language server extension
Definitely possible, but I have a tight schedule, so that might first see the light of day in 2024.

### Allow Svelte statements {#if ...} in a "non-recursively-indented way" (unlike +if(...))

This

```pug
<template lang="pug">
    {#if value > 10}
        span Value is above 10!!🚀✨

    {#if value < 10}
        span Value is below 10

</template>
```

Results in <br>
`</template> attempted to close an element that was not opents(-1)`
<br> ... and I personally don't want errors in my .svelte files unless there is one ...

So this feature will be implemented if this gets resolved.

The feature specifically will look like

```

    {#if value}
        ...
    {:else if}
        ...
    {:else}
        ...
    
    //- Becomes
    +if('value')
        ...
        +elseif('...')
            ...
            +else
                ...
```

and support all {#...}
