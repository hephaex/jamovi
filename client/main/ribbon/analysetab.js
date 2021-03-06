
'use strict';

const $ = require('jquery');

const RibbonMenu = require('./ribbonmenu');

const AnalyseTab = function(modules) {
    this.name = 'analyses';

    this.title = 'Analyses';

    this.modules = modules;

    this._analysesList = { };
    this._moduleCount = 0;

    this.needsRefresh = function() {
        let modules = this.modules.get('modules');
        let count = 0;
        for (let module of modules) {
            let modInfo = this._analysesList[module.name];
            if (modInfo !== undefined && modInfo.version !== module.version)
                return true;

            if (modInfo === undefined && module.analyses.length > 0)
                return true;

            if (module.analyses.length > 0)
                count += 1;
        }

        if (count !== this._moduleCount)
            return true;

        return false;
    };

    this.getRibbonItems = function(ribbon) {
        let buttons = [ ];

        let moduleList = [];
        this._analysesList = { };
        this._moduleCount = 0;
        for (let module of this.modules) {
            if (module.analyses.length > 0) {
                if (this._analysesList[module.name] === undefined) {
                    this._analysesList[module.name] = { version: module.version, analyses: [] };
                    this._moduleCount += 1;
                }
                let subtitle = module.title;
                // This regex is used to trim off any leading shortname (as well as seperators) from the title
                // E.G The module title 'GAMLj - General Analyses for Linear Models' will be trimmed to 'General Analyses for Linear Models'.
                let re = new RegExp('^' + module.name + '([ :-]{1,3})', 'i');
                subtitle = subtitle.replace(re, '');
                let moduleItem = { name : module.name, title : module.name, subtitle: subtitle, ns : 'installed', type: 'module', checked: module.visible  };
                let analyses = { name: 'analyses', title: 'Analyses', type: 'group', items: [ ] };
                for (let analysis of module.analyses) {
                    this._analysesList[module.name].analyses.push(analysis.name);
                    let analysisItem = {
                        name: analysis.name,
                        ns: analysis.ns,
                        title: analysis.menuTitle,
                        subtitle: analysis.menuSubtitle,
                        moduleName: module.name,
                    };
                    analyses.items.push(analysisItem);
                }
                moduleItem.analyses = analyses;
                moduleList.push(moduleItem);
            }
        }

        let $button = $('<div></div>');
        let  button = new RibbonMenu($button, 'Modules', 'modules', [
            { name : 'modules', title : 'jamovi library', ns : 'app' },
            { name : 'manageMods', title : 'Manage installed', ns : 'app' },
            { name: 'installedList', title: 'Installed Modules', type: 'group', items: moduleList }
        ], true, false);
        buttons.push(button);

        let menus = { };
        let lastSub = null;

        for (let module of this.modules) {
            let isNew = module.new;
            for (let analysis of module.analyses) {
                let group = analysis.menuGroup;
                let subgroup = analysis.menuSubgroup;
                let menu = group in menus ? menus[group] : { };
                menu._new = isNew;
                let submenu = { name };
                if (subgroup in menu)
                    submenu = menu[subgroup];
                else
                    submenu = { name: subgroup, title: subgroup, items: [ ] };
                let item = {
                    name: analysis.name,
                    ns: analysis.ns,
                    title: analysis.menuTitle,
                    subtitle: analysis.menuSubtitle,
                    moduleName: module.name,
                    new: isNew,
                    hidden: module.visible === false
                };
                submenu.items.push(item);
                menu[subgroup] = submenu;
                menus[group] = menu;
            }
        }

        for (let group in menus) {
            let menu = menus[group];
            let flattened = [ ];
            let containsNew = menu._new;
            for (let subgroup in menu) {
                if (subgroup === '_new')
                    continue;
                flattened.push({
                    name: subgroup,
                    title: subgroup,
                    type: 'group',
                    items: menu[subgroup].items });
            }

            if (flattened.length > 0 && flattened[0].name === '') {
                let items = flattened.shift().items;
                flattened = items.concat(flattened);
            }

            let $button = $('<div></div>');
            let  button = new RibbonMenu($button, group, group, flattened, false, containsNew);
            buttons.push(button);
        }

        return buttons;
    };
};

module.exports = AnalyseTab;
