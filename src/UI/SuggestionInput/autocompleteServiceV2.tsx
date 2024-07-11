import axios, { Method } from "axios";

const ip = "http://193.52.45.42:8585/";
//const data = ["apple","apple watch","iphone","iphone x","apple macbook","apple macbook air","apple macbook air pro 13"];
const conditions1 = {
    "If": {
        "placeholder": "<Condition>",
        "next": "then"
    },
    "When": {
        "placeholder": "<Condition>",
        "next": "then"
    },
    "While": {
        "placeholder": "<Activation State>",
        "next": ""
    },
    "During": {
        "placeholder": "<Activation State>",
        "next": ""
    },
    "In Case": {
        "placeholder": "<Included Feature>",
        "next": "is included"
    },
    "After": {
        "placeholder": "<Behavior>",
        "next": ""
    },
    "Before": {
        "placeholder": "<Behavior>",
        "next": ""

    },
    "As soon as": {
        "placeholder": "<Behavior>",
        "next": ""

    }
};
const system = {
    "The": {
        "placeholder": "<System or Part Name>",
        "next": ""
    }
};
const systemDomain = {
    "All": {
        "placeholder1": "",
        "next": "systems of the",
        "placeholder2": "<Product line>",
        "placeholder3": ""
    },
    "Some": {
        "placeholder1": "",
        "next": "systems of the",
        "placeholder2": "<Product line>",
        "placeholder3": ""
    },
    "Those": {
        "placeholder1": "",
        "next": "systems of the",
        "placeholder2": "<Product line>",
        "placeholder3": "Restriction: "

    }

};
const priority = ["shall", "should", "could", "will"];
const activity = {
    "provide": {
        "placeholder1": "<Who?>",
        "next": "with the ability to",
        "placeholder2": "<Process Verb>"
    },
    "verb": {
        "placeholder1": "<Process Verb>",
        "next": "",
        "placeholder2": ""
    },
    "be able to": {
        "placeholder1": "<Process Verb>",
        "next": [
            "from",
            "towards"
        ],
        "placeholder2": "<System or External Device Name>"
    }
};
var securityCriteria = [];
const asset = {
    "of": {
        "As Many": {
            "placeholder1": "<Objects/Assets>",
            "next": "as possible",
            "placeholder2": "",
            "placeholder3": ""
        },
        "As Few": {
            "placeholder1": "<Objects/Assets>",
            "next": "as possible",
            "placeholder2": "",
            "placeholder3": ""
        },
        "A": {
            "placeholder1": "<Objects/Assets>",
            "next": "",
            "placeholder2": "",
            "placeholder3": ""
        },
        "An": {
            "placeholder1": "<Objects/Assets>",
            "next": "",
            "placeholder2": "",
            "placeholder3": ""
        },
        "The": {
            "placeholder1": "<Objects/Assets>",
            "next": "",
            "placeholder2": "",
            "placeholder3": ""
        },
        "Number:": {
            "placeholder1": "<X>",
            "next": "",
            "placeholder2": "<Objects/Assets>",
            "placeholder3": ""
        },
        "Between": {
            "placeholder1": "<A>",
            "next": "and",
            "placeholder2": "<B>",
            "placeholder3": "<Objects/Assets>"
        },
        "All the": {
            "placeholder1": "<Objects/Assets>",
            "next": "",
            "placeholder2": "",
            "placeholder3": ""
        }

    }

};
var securityMechanism = [];
const validation = {
    "complying with": {
        "placeholder1": "<Validation Criteria>"
    },
    "validationCriteria": {
        "placeholder1": "<Validation Criteria>"
    }
};
const condition2 = {
    "if and only if": {
        "placeholder1": "<Condition>"
    }
};
const additionalObjectDetails = {
    "additionalDetails": {
        "placeholder1": "<Additional Object Details>"
    }
};
const autoAdaptive = {
    "before": {
        "placeholder1": "<Event>",
        "placeholder2": ""
    },
    "after": {
        "placeholder1": "<Event>",
        "placeholder2": ""
    },
    "during": {
        "placeholder1": "<Event>",
        "placeholder2": ""
    },
    "as early as possible before": {
        "placeholder1": "<Event>",
        "placeholder2": ""
    },
    "as early as possible after": {
        "placeholder1": "<Event>",
        "placeholder2": ""
    },
    "as early as possible during": {
        "placeholder1": "<Event>",
        "placeholder2": ""
    },
    "as late as possible before": {
        "placeholder1": "<Event>",
        "placeholder2": ""
    },
    "as late as possible after": {
        "placeholder1": "<Event>",
        "placeholder2": ""
    },
    "as late as possible during": {
        "placeholder1": "<Event>",
        "placeholder2": ""
    },
    "until": {
        "placeholder1": "<Event>",
        "placeholder2": ""
    },
    "within": {
        "placeholder1": "<Time Interval>",
        "placeholder2": "<Time Unit>"
    },
    "at least": {
        "placeholder1": "<Quantity>",
        "placeholder2": "<Frequency>"
    },
    "eventually": {
        "placeholder1": "",
        "placeholder2": ""
    },
    "as close as possible to": {
        "placeholder1": [
            "<Quantity>",
            "<Frequency>"
        ],
        "placeholder2": ""
    }




};
var domains = [];

var secret:any={};


const getAllCriteria = async () => {

    try {
        var res = await axios.get(ip + 'criteria')
        //console.log(res);
        securityCriteria = res.data;

        //.then((response)=>{

        //securityCriteria=response.data;
        //})
        //.catch(function (error) {
        //console.log(error.toJSON());
        //});
    }
    catch (e) {
        console.log(e)
    }

}

const getDomainCriteria = async (domain) => {

    try {
        var res = await axios.get(ip + 'domain/' + domain + '/criteria')
        //console.log(res);
        securityCriteria = res.data;

        //.then((response)=>{

        //securityCriteria=response.data;
        //})
        //.catch(function (error) {
        //console.log(error.toJSON());
        //});
    }
    catch (e) {
        console.log(e)
    }

}

async function getCriteriaMechanisms(criterion) {

    try {
        var res = await axios.get(ip + 'criteria/' + criterion + '/mechanisms')
        //console.log(res);
        securityMechanism = res.data;

        //.then((response)=>{

        //securityCriteria=response.data;
        //})
        //.catch(function (error) {
        //console.log(error.toJSON());
        //});
    }
    catch (e) {
        console.log(e)
    }

}
async function getDomainCriteriaMechanisms(criterion, domain) {

    try {
        var res = await axios.get(ip + 'domain/' + domain + '/' + criterion)
        //console.log(res);
        securityMechanism = res.data;

        //.then((response)=>{

        //securityCriteria=response.data;
        //})
        //.catch(function (error) {
        //console.log(error.toJSON());
        //});
    }
    catch (e) {
        console.log(e)
    }

}
function elementInSentence(obj, sentence) {
    var str = "";
    Object.keys(obj).some(element => {
        //console.log(element);
        if (sentence.match(element + " ")) { console.log(element); str = element; }
    })
    return str;
}
function ObjectInSentence(obj, sentence) {
    var str = "";
    Object.keys(obj).some(element => {
        //console.log(element);
        if (sentence.match("of " + element + " ")) { console.log(element); str = element; }
    })
    return str;
}

//Application security requirements
async function securityRequirementsSuggest(req) {
    console.log(req.input)
    //await domainsList();
    var words = req.input.trim().split(" ");
    var sentence = req.input.trim();
    var domain = req.domain.trim();
    console.log(sentence)
    console.log(domains)
    //var str={"input":sentence, "options":[]};
    var options = [];
    //var c1=words.some(item => Object.keys(conditions1).includes(item));
    var c1 = Object.keys(conditions1).some(element => {
        return sentence.includes(element);
    })
    console.log(c1);
    //var s=words.some(item => Object.keys(system).includes(item));
    var s = Object.keys(system).some(element => {
        return sentence.includes(element);
    })
    console.log(words);
    console.log(s);
    //var p=words.some(item =>priority.includes(item));
    var p = priority.some(element => {
        return sentence.includes(element);
    })
    //var a1=words.some(item => Object.keys(activity).includes(item));
    var a1 = Object.keys(activity).some(element => {
        return sentence.includes(element) || sentence.includes("verb:");
    })
    console.log(a1);
    //var sc=words.some(item => securityCriteria.includes(item));
    var sc = securityCriteria.some(element => {
        return sentence.includes(element);
    })
    //var a2=words.some(item => Object.keys(asset["of"]).includes(item));
    var a2 = Object.keys(asset["of"]).some(element => {
        return sentence.includes("of " + element);
    })
    var sm = securityMechanism.some(element => {
        return (sentence.includes(element) || (sentence.includes("by") && words[words.length - 1] != "by" && !sentence.includes("<Security Mechanism>")));
    })

    //var sm=false//words.some(item => securityMechanism.includes(item));
    //var vc=words.includes(Object.keys(validation));
    var vc = Object.keys(validation).some(element => {
        return sentence.includes(element);
    })
    //var ad=words.includes(Object.keys(additionalObjectDetails));
    var ad = Object.keys(additionalObjectDetails).some(element => {
        return sentence.includes(element);
    })
    //var c2=words.includes(Object.keys(condition2));
    var c2 = Object.keys(condition2).some(element => {
        return sentence.includes(element);
    })
    //var aa=words.includes(Object.keys(autoAdaptive));
    var aa = Object.keys(autoAdaptive).some(element => {
        return sentence.includes(element);
    })
    var criterion = "";

    // if(words.some(item => activity[elementInSentence(activity,sentence)]["next"].includes(item))) console.log("OK");

    // res.end(JSON.stringify(data.filter(value => value.includes(req.q))));

    // no text yet, show the conditions
    // if(req.q=="")res.end(JSON.stringify(Object.keys(conditions1)));
    // text but no complete condition yet, auto-complete the condition
    //else if(!Object.keys(conditions1).includes(req.q) && req.q!="" && !Object.keys(system).includes(req.q) && !priority.includes(req.q)) res.end(JSON.stringify(Object.keys(conditions1).filter(value => value.includes(req.q))));
    // complete condition, send the values
    //else if(Object.keys(conditions1).includes(req.q))res.end(JSON.stringify(conditions1[req.q]));
    //
    //else if(!Object.keys(system).includes(req.q) && !priority.includes(req.q)) res.end(JSON.stringify(Object.keys(system).filter(value => value.includes(req.q))))
    //
    //else if(Object.keys(system).includes(req.q)) res.end(JSON.stringify(system[req.q]));
    //
    //else if(priority.includes(req.q)) res.end(JSON.stringify(priority.filter(value=> value.includes(req.q))));
    //
    //else if(priority.includes(req.q)) res.end(JSON.stringify(priority.includes(req.q)))
    if (sentence == "") { options.push.apply(options, Object.keys(conditions1)); options.push.apply(options, Object.keys(system)); console.log(options); secret = {}; }

    else if (!c1 && req.input != "" && !s && !p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {
        if (Object.keys(conditions1).filter(value => value.includes(req.input)).length > 0) options = (Object.keys(conditions1).filter(value => value.includes(req.input)));
        if (Object.keys(system).filter(value => value.includes(req.input)).length > 0) options = (Object.keys(system).filter(value => value.includes(req.input)));
        console.log(options)
    }
    else if (c1 && req.input != "" && !s && !p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {

        if (Object.keys(conditions1).includes(words[words.length - 1]))
            options.push((conditions1[words[words.length - 1]]).placeholder);
        else if (words.length >= 2 && Object.keys(conditions1).includes(words[words.length - 2] + " " + words[words.length - 1]))
            options.push((conditions1[words[words.length - 2] + " " + words[words.length - 1]]).placeholder);
        else if (words.length >= 3 && Object.keys(conditions1).includes(words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]))
            options.push((conditions1[words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]]).placeholder);
        else if (conditions1[elementInSentence(conditions1, sentence)]["next"] != "" &&
            (words[words.length - 1]) != conditions1[elementInSentence(conditions1, sentence)]["next"] &&
            (words[words.length - 2] + " " + words[words.length - 1]) != conditions1[elementInSentence(conditions1, sentence)]["next"])
            options.push(conditions1[elementInSentence(conditions1, sentence)]["next"]);
        else options = (Object.keys(system));
    }
    else if (s && !p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {
        if (Object.keys(system).includes(words[words.length - 1])) {
            //Add the previous part to condition in secret variable
            var condition = sentence.replace(words[words.length - 1], "");
            if (condition != "") secret.condition = condition.trim();
            //Add the system options to be suggested
            options.push((system[words[words.length - 1]]).placeholder);
            console.log(secret);
        }
        else options = (priority);
    }
    else if (p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {
        if (priority.includes(words[words.length - 1])) {
            //Add the previous part to system in secret variable
            var sys = sentence.replace(words[words.length - 1], "");
            if (secret.condition) sys = sys.replace(secret.condition, "").trim();
            secret.system = sys;
            secret.priority = words[words.length - 1];
            //Add the activity options to be suggested
            options = (Object.keys(activity));
            console.log(secret);
        }
        //verb replaced
        /* else if (priority.includes(words[words.length - 2])) {
            //Add to activity in secret variable
            secret.activity=words[words.length - 1];
            if(domains.includes(domain)) await getDomainCriteria(domain)
            else await getAllCriteria();
            options = (securityCriteria);
            console.log(secret);
        } */
    }
    else if (a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {

        if (Object.keys(activity).includes(words[words.length - 1])) {
            if (words[words.length - 1] == "verb") sentence = sentence.replace("verb", "verb: ");
            options.push((activity[words[words.length - 1]]).placeholder1);
        }
        else if (words.length >= 3 && Object.keys(activity).includes(words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1])) {
            options.push((activity[words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]]).placeholder1);
        }
        else if (!sentence.includes("verb:") && activity[elementInSentence(activity, sentence)]["next"] != "" &&
            (!Array.isArray(activity[elementInSentence(activity, sentence)]["next"]) &&
                !sentence.includes(activity[elementInSentence(activity, sentence)]["next"]) &&
                (words[words.length - 1]) != activity[elementInSentence(activity, sentence)]["next"] &&
                (words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]) != activity[elementInSentence(activity, sentence)]["next"] &&
                !activity[elementInSentence(activity, sentence)]["next"].includes((words[words.length - 1])) ||
                (Array.isArray(activity[elementInSentence(activity, sentence)]["next"]) && !words.some(item => activity[elementInSentence(activity, sentence)]["next"].includes(item)))))
            if (Array.isArray(activity[elementInSentence(activity, sentence)]["next"]))
                options.push.apply(options, activity[elementInSentence(activity, sentence)]["next"]);
            else options.push(activity[elementInSentence(activity, sentence)]["next"])
        else if (!sentence.includes("verb:") && activity[elementInSentence(activity, sentence)]["next"] != "" &&
            (activity[elementInSentence(activity, sentence)]).placeholder2 != "" &&
            ((words[words.length - 1]) == activity[elementInSentence(activity, sentence)]["next"] ||
                (words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]) == activity[elementInSentence(activity, sentence)]["next"] ||
                activity[elementInSentence(activity, sentence)]["next"].includes((words[words.length - 1]))))
            options.push((activity[elementInSentence(activity, sentence)]).placeholder2)
        else {

            console.log(securityCriteria)
            //Needs to be synchronized
            if (domains.includes(domain)) await getDomainCriteria(domain)
            else await getAllCriteria();
            options = (securityCriteria);

        }
    }
    else if (sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {

        if (securityCriteria.includes(words[words.length - 1])) {
            //Add to activity in secret variable
            secret.activity = (sentence.split(secret.priority)[1]).replace(words[words.length - 1], "").trim();
            criterion = words[words.length - 1];
            //Add to criterion in secret variable
            secret.securityCriteria = criterion;
            console.log(criterion)


            sentence += " of ";
            options = (Object.keys(asset["of"]));
            console.log(secret);

        }
    }
    else if (a2 && !sm && !vc && !ad && !c2 && !aa) {
        //console.log(sentence.split("of")[1])
        //console.log(((asset["of"])[elementInSentence((asset["of"]),sentence.split("of")[1])]));
        sentence = sentence.replace("verb: ", "");
        if (Object.keys(asset["of"]).includes(words[words.length - 1])) {
            options.push(((asset["of"])[words[words.length - 1]]).placeholder1);
            console.log(options);
        }
        else if (Object.keys(asset["of"]).includes(words[words.length - 2] + " " + words[words.length - 1])) {
            options.push(((asset["of"])[words[words.length - 2] + " " + words[words.length - 1]]).placeholder1);
        }
        else if ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] != "" &&
            !sentence.includes((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"]) &&
            (words[words.length - 1]) != (asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] &&
            (words[words.length - 2] + " " + words[words.length - 1]) != (asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] &&
            !(asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"].includes((words[words.length - 1])))
            options.push((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"])
        else if ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] != "" &&
            ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]).placeholder2 != "" &&
            ((words[words.length - 1]) == (asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] ||
                (words[words.length - 2] + " " + words[words.length - 1]) == (asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] ||
                (asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"].includes((words[words.length - 1]))))
            options.push(((asset["of"])[ObjectInSentence((asset["of"]), sentence)]).placeholder2)
        else if ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] == "" &&
            ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]).placeholder2 != "" &&
            (ObjectInSentence((asset["of"]), sentence)) == (words[words.length - 2]))
            options.push(((asset["of"])[ObjectInSentence((asset["of"]), sentence)]).placeholder2)
        else if ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] != "" &&
            ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]).placeholder3 != "" &&
            ((words[words.length - 1]) != (asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] &&
                (words[words.length - 2] + " " + words[words.length - 1]) != (asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] &&
                (sentence.includes((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"]))) &&
            ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] == (words[words.length - 2])))
            options.push(((asset["of"])[ObjectInSentence((asset["of"]), sentence)]).placeholder3)

        else if (sentence.includes("by <Security Mechanism>")) {
            sentence = sentence.replace("by <Security Mechanism>", "");
            sentence += "by ";
            criterion = securityCriteria.find(element => words.includes(element));
            console.log(criterion);
            if (criterion != "") {
                if (domains.includes(domain)) await getDomainCriteriaMechanisms(criterion, domain)
                else await getCriteriaMechanisms(criterion);
            }
            options.push.apply(options, securityMechanism);
        }
        else {
            console.log("else")
            //Add to asset in secret variable
            secret.asset = sentence.split(secret.securityCriteria)[1].replace("of", "").trim();

            //sentence += " by ";
            options.push.apply(options, Object.keys(condition2));
            options.push.apply(options, Object.keys(additionalObjectDetails));
            options.push("by <Security Mechanism>");
            options.push.apply(options, Object.keys(validation));
            options.push.apply(options, Object.keys(autoAdaptive));
            console.log(options)
            console.log(secret);
        }
        //if(elementInSentence((asset["of"]),sentence)=="Number") sentence=sentence.replace("","");
    }
    else if (!ad && c2 && !aa && !sm && !vc) {
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        if (Object.keys(condition2).includes(words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1])) {
            options.push(condition2[words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1);

        }
        else if (sentence.includes("by <Security Mechanism>")) {
            sentence = sentence.replace("by <Security Mechanism>", "");
            sentence += "by ";
            criterion = securityCriteria.find(element => words.includes(element));
            console.log(criterion);
            if (criterion != "") {
                if (domains.includes(domain)) await getDomainCriteriaMechanisms(criterion, domain)
                else await getCriteriaMechanisms(criterion);
            }
            options.push.apply(options, securityMechanism);
        }
        else {
            //Add to securityMechanism in secret variable

            options.push.apply(options, Object.keys(additionalObjectDetails));
            options.push("by <Security Mechanism>");
            options.push.apply(options, Object.keys(validation));
            options.push.apply(options, Object.keys(autoAdaptive));

            //console.log(sentence.split(secret.asset.trim()));
            secret.conditionalityObject = sentence.split(secret.asset)[1].trim();
            console.log(secret);
        }

    }
    else if (ad && !aa && !sm && !vc) {
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        if (Object.keys(additionalObjectDetails).includes(words[words.length - 1])) {
            if (!sentence.includes("additionalDetails:")) sentence = sentence.replace("additionalDetails", "additionalDetails:");
            options.push(additionalObjectDetails[words[words.length - 1]].placeholder1);

        }
        else if (sentence.includes("by <Security Mechanism>")) {
            sentence = sentence.replace("by <Security Mechanism>", "");
            sentence += "by ";
            criterion = securityCriteria.find(element => words.includes(element));
            console.log(criterion);
            if (criterion != "") {
                if (domains.includes(domain)) await getDomainCriteriaMechanisms(criterion, domain)
                else await getCriteriaMechanisms(criterion);
            }
            options.push.apply(options, securityMechanism);
            //sentence = sentence.replace("additionalDetails:", "");
        }
        else {
            //ad=true;
            //sentence = sentence.replace("additionalDetails:", "");
            secret.additionalObjectDetails = sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace("additionalDetails:", "").trim();
            options.push("by <Security Mechanism>");
            options.push.apply(options, Object.keys(validation));
            options.push.apply(options, Object.keys(autoAdaptive));
            options.push.apply(Object.keys(autoAdaptive));
            console.log(secret);
        }

    }

    else if (sm && !vc && !aa) {
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        //Add to securityMechanism in secret variable
        sentence = sentence.replace("additionalDetails:", "");
        secret.securityMechanism = sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace(secret.additionalObjectDetails, "").replace("by", "").trim();
        console.log(secret);
        //console.log(asset["of"])
        //if (securityMechanism.includes(words[words.length - 1])) {
        options.push.apply(options, Object.keys(validation));
        //options.push.apply(options, Object.keys(condition2));
        //options.push.apply(options, Object.keys(additionalObjectDetails));
        options.push.apply(options, Object.keys(autoAdaptive));
        console.log(options)

        //}

    }
    else if (vc && !aa) {
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        sentence = sentence.replace("additionalDetails:", "");
        if (Object.keys(validation).includes(words[words.length - 1])) {
            if (!sentence.includes("validationCriteria:")) sentence = sentence.replace("validationCriteria", "validationCriteria:");
            options.push(validation[words[words.length - 1]].placeholder1);

        }
        else if (Object.keys(validation).includes(words[words.length - 2] + " " + words[words.length - 1])) {
            options.push(validation["complying with"].placeholder1);

        }
        else {
            // options.push.apply(options, Object.keys(condition2));
            // options.push.apply(options, Object.keys(additionalObjectDetails));
            console.log("else")
            //Add to asset in secret variable
            secret.validationCriterion = sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace(secret.additionalObjectDetails, "").replace("by", "").replace(secret.securityMechanism, "").replace("validationCriteria: ", "").trim();
            options.push.apply(options, Object.keys(autoAdaptive));
            //sentence = sentence.replace("validationCriteria:", "");
            console.log(secret);
        }

    }
    /*     else if (!ad && c2 && !aa) {
    
            if (Object.keys(condition2).includes(words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1])) {
                options.push(condition2[words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1);
    
            }
            else {
                options.push.apply(options, Object.keys(additionalObjectDetails));
                options.push.apply(options, Object.keys(autoAdaptive));
            }
    
        } */

    else if (aa) {
        console.log("aa")
        //console.log(elementInSentence(autoAdaptive, sentence));
        if (sentence.includes("additionalDetails:")) sentence = sentence.replace("additionalDetails:", "");
        sentence = sentence.replace("validationCriteria", "validationCriteria:");
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        if ((Object.keys(autoAdaptive).includes(words[words.length - 1])) && (autoAdaptive[words[words.length - 1]].placeholder1 != "")) {
            options.push(autoAdaptive[words[words.length - 1]].placeholder1);

        }
        else if (Object.keys(autoAdaptive).includes(words[words.length - 2] + " " + words[words.length - 1]) && (autoAdaptive[words[words.length - 2] + " " + words[words.length - 1]].placeholder1 != "")) {
            options.push(autoAdaptive[words[words.length - 2] + " " + words[words.length - 1]].placeholder1);

        }
        else if (Object.keys(autoAdaptive).includes(words[words.length - 5] + " " + words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]) && (autoAdaptive[words[words.length - 5] + " " + words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1 != "")) {
            options.push(autoAdaptive[words[words.length - 5] + " " + words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1);

        }
        else if (words[words.length - 1] != "eventually" && (autoAdaptive[elementInSentence((autoAdaptive), sentence)]).placeholder2 != "" &&
            elementInSentence((autoAdaptive), sentence) != words[words.length - 1] &&
            elementInSentence((autoAdaptive), sentence) != words[words.length - 2] + " " + words[words.length - 1] &&
            (elementInSentence((autoAdaptive), sentence) == words[words.length - 2] || elementInSentence((autoAdaptive), sentence) == words[words.length - 3] + " " + words[words.length - 2]))
            options.push(((autoAdaptive)[elementInSentence((autoAdaptive), sentence)]).placeholder2)
        else {
            console.log("aa else")
            console.log(sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace(secret.additionalObjectDetails, "").replace("by", "").replace(secret.securityMechanism, "").replace(secret.validationCriterion, "").trim());
            secret.autoAdaptive = sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace(secret.additionalObjectDetails, "").replace("by", "").replace(secret.securityMechanism, "").replace(secret.validationCriterion, "").trim();
            console.log(secret);
        }

    }
    //if(sentence.includes("additionalDetails:"))sentence = sentence.replace("additionalDetails:", "");
    let data = { "input": sentence, "options": options, "secret": secret };

    return data;
}

async function functionalRequirementsSuggest(req) {


    console.log(req.input)
    //res.setHeader('Content-Type', 'application/json');

    var words = req.input.trim().split(" ");
    var sentence = req.input.trim();
    console.log(sentence)
    //var str={"input":sentence, "options":[]};
    var options = [];
    //var c1=words.some(item => Object.keys(conditions1).includes(item));
    var c1 = Object.keys(conditions1).some(element => {
        return sentence.includes(element);
    })
    console.log(c1);
    //var s=words.some(item => Object.keys(system).includes(item));
    var s = Object.keys(system).some(element => {
        return sentence.includes(element);
    })
    console.log(words);
    console.log(s);
    //var p=words.some(item =>priority.includes(item));
    var p = priority.some(element => {
        return sentence.includes(element);
    })
    //var a1=words.some(item => Object.keys(activity).includes(item));
    var a1 = Object.keys(activity).some(element => {
        return sentence.includes(element);
    })
    console.log(a1);
    //var sc=words.some(item => securityCriteria.includes(item));
    var sc = securityCriteria.some(element => {
        return sentence.includes(element);
    })
    //var a2=words.some(item => Object.keys(asset["of"]).includes(item));
    var a2 = Object.keys(asset["of"]).some(element => {
        var pr = "";
        priority.some(e => { if (sentence.includes(e)) pr = e; })
        console.log()
        if (p) return (sentence.includes(element, sentence.indexOf(pr)));
        else return false;
    })
    console.log(a2 + " A2")
    var sm = securityMechanism.some(element => {
        return sentence.includes(element);
    })

    //var sm=false//words.some(item => securityMechanism.includes(item));
    //var vc=words.includes(Object.keys(validation));
    var vc = Object.keys(validation).some(element => {
        return sentence.includes(element);
    })
    //var ad=words.includes(Object.keys(additionalObjectDetails));
    var ad = Object.keys(additionalObjectDetails).some(element => {
        return sentence.includes(element);
    })
    //var c2=words.includes(Object.keys(condition2));
    var c2 = Object.keys(condition2).some(element => {
        return sentence.includes(element);
    })
    //var aa=words.includes(Object.keys(autoAdaptive));
    var aa = Object.keys(autoAdaptive).some(element => {
        return sentence.includes(element);
    })
    var criterion = "";

    // if(words.some(item => activity[elementInSentence(activity,sentence)]["next"].includes(item))) console.log("OK");

    // res.end(JSON.stringify(data.filter(value => value.includes(req.q))));

    // no text yet, show the conditions
    // if(req.q=="")res.end(JSON.stringify(Object.keys(conditions1)));
    // text but no complete condition yet, auto-complete the condition
    //else if(!Object.keys(conditions1).includes(req.q) && req.q!="" && !Object.keys(system).includes(req.q) && !priority.includes(req.q)) res.end(JSON.stringify(Object.keys(conditions1).filter(value => value.includes(req.q))));
    // complete condition, send the values
    //else if(Object.keys(conditions1).includes(req.q))res.end(JSON.stringify(conditions1[req.q]));
    //
    //else if(!Object.keys(system).includes(req.q) && !priority.includes(req.q)) res.end(JSON.stringify(Object.keys(system).filter(value => value.includes(req.q))))
    //
    //else if(Object.keys(system).includes(req.q)) res.end(JSON.stringify(system[req.q]));
    //
    //else if(priority.includes(req.q)) res.end(JSON.stringify(priority.filter(value=> value.includes(req.q))));
    //
    //else if(priority.includes(req.q)) res.end(JSON.stringify(priority.includes(req.q)))
    if (sentence == "") { options.push.apply(options, Object.keys(conditions1)); options.push.apply(options, Object.keys(system)); console.log(options); secret = {}; }

    else if (!c1 && req.input != "" && !s && !p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {
        if (Object.keys(conditions1).filter(value => value.includes(req.input)).length > 0) options = (Object.keys(conditions1).filter(value => value.includes(req.input)));
        if (Object.keys(system).filter(value => value.includes(req.input)).length > 0) options = (Object.keys(system).filter(value => value.includes(req.input)));
        console.log(options)
    }
    else if (c1 && req.input != "" && !s && !p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {

        if (Object.keys(conditions1).includes(words[words.length - 1]))
            options.push((conditions1[words[words.length - 1]]).placeholder);
        else if (words.length >= 2 && Object.keys(conditions1).includes(words[words.length - 2] + " " + words[words.length - 1]))
            options.push((conditions1[words[words.length - 2] + " " + words[words.length - 1]]).placeholder);
        else if (words.length >= 3 && Object.keys(conditions1).includes(words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]))
            options.push((conditions1[words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]]).placeholder);
        else if (conditions1[elementInSentence(conditions1, sentence)]["next"] != "" &&
            (words[words.length - 1]) != conditions1[elementInSentence(conditions1, sentence)]["next"] &&
            (words[words.length - 2] + " " + words[words.length - 1]) != conditions1[elementInSentence(conditions1, sentence)]["next"])
            options.push(conditions1[elementInSentence(conditions1, sentence)]["next"]);
        else options = (Object.keys(system));
    }
    else if (s && !p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {
        if (Object.keys(system).includes(words[words.length - 1])) {
            var condition = sentence.replace(words[words.length - 1], "");
            if (condition != "") secret.condition = condition.trim();
            options.push((system[words[words.length - 1]]).placeholder);
        }
        else options = (priority);
    }
    else if (p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {
        if (priority.includes(words[words.length - 1])) {
            var sys = sentence.replace(words[words.length - 1], "");
            if (secret.condition) sys = sys.replace(secret.condition, "").trim();
            secret.system = sys;
            secret.priority = words[words.length - 1];
            options = (Object.keys(activity));
        }
        //verb replaced
        /* else if (priority.includes(words[words.length - 2])) {
           // await getAllCriteria();
            //options = (securityCriteria);
            options = (Object.keys(asset["of"]));
        } */
    }
    else if (a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {

        if (Object.keys(activity).includes(words[words.length - 1])) {
            if (words[words.length - 1] == "verb") sentence = sentence.replace("verb", "verb: ");
            if ((words[words.length - 1]) == "provide") options = (Object.keys(asset["of"]))
            options.push((activity[words[words.length - 1]]).placeholder1);
        }
        else if (words.length >= 3 && Object.keys(activity).includes(words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1])) {
            options.push((activity[words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]]).placeholder1);
        }
        else if (!sentence.includes("verb:") && activity[elementInSentence(activity, sentence)]["next"] != "" &&
            (!Array.isArray(activity[elementInSentence(activity, sentence)]["next"]) &&
                !sentence.includes(activity[elementInSentence(activity, sentence)]["next"]) &&
                (words[words.length - 1]) != activity[elementInSentence(activity, sentence)]["next"] &&
                (words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]) != activity[elementInSentence(activity, sentence)]["next"] &&
                !activity[elementInSentence(activity, sentence)]["next"].includes((words[words.length - 1])) ||
                (Array.isArray(activity[elementInSentence(activity, sentence)]["next"]) && !words.some(item => activity[elementInSentence(activity, sentence)]["next"].includes(item)))))
            if (Array.isArray(activity[elementInSentence(activity, sentence)]["next"]))
                options.push.apply(options, activity[elementInSentence(activity, sentence)]["next"]);
            else options.push(activity[elementInSentence(activity, sentence)]["next"])
        else if (!sentence.includes("verb:") && activity[elementInSentence(activity, sentence)]["next"] != "" &&
            (activity[elementInSentence(activity, sentence)]).placeholder2 != "" &&
            ((words[words.length - 1]) == activity[elementInSentence(activity, sentence)]["next"] ||
                (words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]) == activity[elementInSentence(activity, sentence)]["next"] ||
                activity[elementInSentence(activity, sentence)]["next"].includes((words[words.length - 1]))))
            options.push((activity[elementInSentence(activity, sentence)]).placeholder2)
        else {
            //console.log(securityCriteria)
            //Needs to be synchronized
            //await getAllCriteria();
            //options = (securityCriteria);

            options = (Object.keys(asset["of"]));

        }
    }
    // else if (sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {

    //     if (securityCriteria.includes(words[words.length - 1])) {
    //         criterion = words[words.length - 1];
    //         console.log(criterion)
    //         sentence += " of ";
    //         options = (Object.keys(asset["of"]));

    //     }
    // }
    else if (a2 && !sm && !vc && !ad && !c2 && !aa) {
        //console.log(sentence.split("of")[1])
        console.log((sentence.split(secret.priority))[1]);
        sentence = sentence.replace("verb: ", "");
        if (Object.keys(asset["of"]).includes(words[words.length - 1])) {
            secret.activity = (sentence.split(secret.priority)[1]).replace(words[words.length - 1], "").trim();
            options.push(((asset["of"])[words[words.length - 1]]).placeholder1);
            console.log(options);
        }
        else if (Object.keys(asset["of"]).includes(words[words.length - 2] + " " + words[words.length - 1])) {
            secret.activity = (sentence.split(secret.priority)[1]).replace(words[words.length - 2] + " " + words[words.length - 1], "").trim();
            options.push(((asset["of"])[words[words.length - 2] + " " + words[words.length - 1]]).placeholder1);
        }
        else if ((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] != "" &&
            !sentence.includes((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"]) &&
            (words[words.length - 1]) != (asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] &&
            (words[words.length - 2] + " " + words[words.length - 1]) != (asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] &&
            !(asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"].includes((words[words.length - 1])))
            options.push((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"])
        else if ((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] != "" &&
            ((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]).placeholder2 != "" &&
            ((words[words.length - 1]) == (asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] ||
                (words[words.length - 2] + " " + words[words.length - 1]) == (asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] ||
                (asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"].includes((words[words.length - 1]))))
            options.push(((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]).placeholder2)
        else if ((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] == "" &&
            ((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]).placeholder2 != "" &&
            (elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])) == (words[words.length - 2]))
            options.push(((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]).placeholder2)
        else if ((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] != "" &&
            ((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]).placeholder3 != "" &&
            ((words[words.length - 1]) != (asset["of"])[elementInSentence((asset["of"]), sentence)]["next"] &&
                (words[words.length - 2] + " " + words[words.length - 1]) != (asset["of"])[elementInSentence((asset["of"]), sentence)]["next"] &&
                (sentence.includes((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"]))) &&
            ((asset["of"])[elementInSentence((asset["of"]), sentence)]["next"] == (words[words.length - 2])))
            options.push(((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]).placeholder3)
        else {
            console.log("else");
            secret.asset = sentence.split(secret.activity)[1].trim();
            //Needs to be synchronized
            //criterion = securityCriteria.find(element => words.includes(element));
            //console.log(criterion);
            //if (criterion != "") await getCriteriaMechanisms(criterion);
            //sentence += " by ";
            //options = (securityMechanism);
            options.push.apply(options, Object.keys(condition2));
            options.push.apply(options, Object.keys(additionalObjectDetails));
            options.push.apply(options, Object.keys(validation));
            options.push.apply(options, Object.keys(autoAdaptive));

        }
        //if(elementInSentence((asset["of"]),sentence)=="Number") sentence=sentence.replace("","");
    }
    // else if (sm && !vc && !ad && !c2 && !aa) {

    //     //console.log(asset["of"])
    //     if (securityMechanism.includes(words[words.length - 1])) {
    //         options.push.apply(options, Object.keys(validation));
    //         options.push.apply(options, Object.keys(condition2));
    //         options.push.apply(options, Object.keys(additionalObjectDetails));
    //         options.push.apply(options, Object.keys(autoAdaptive));
    //         console.log(options)

    //     }

    // }
    else if (!ad && c2 && !aa && !sm && !vc) {
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        if (Object.keys(condition2).includes(words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1])) {
            options.push(condition2[words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1);
        }
        else {
            //Add to securityMechanism in secret variable

            options.push.apply(options, Object.keys(additionalObjectDetails));
            options.push.apply(options, Object.keys(validation));
            options.push.apply(options, Object.keys(autoAdaptive));

            //console.log(sentence.split(secret.asset.trim()));
            secret.conditionalityObject = sentence.split(secret.asset)[1].trim();
            console.log(secret);
        }

    }
    else if (ad && !aa && !sm && !vc) {
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        if (Object.keys(additionalObjectDetails).includes(words[words.length - 1])) {
            if (!sentence.includes("additionalDetails:")) sentence = sentence.replace("additionalDetails", "additionalDetails:");
            options.push(additionalObjectDetails[words[words.length - 1]].placeholder1);

        }
        else {
            //ad=true;
            //sentence = sentence.replace("additionalDetails:", "");
            secret.additionalObjectDetails = sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace("additionalDetails:", "").trim();
            options.push.apply(options, Object.keys(validation));
            options.push.apply(options, Object.keys(autoAdaptive));
            options.push.apply(Object.keys(autoAdaptive));
            console.log(secret);
        }

    }

    else if (vc && !aa) {
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        sentence = sentence.replace("additionalDetails:", "");
        if (Object.keys(validation).includes(words[words.length - 1])) {
            if (!sentence.includes("validationCriteria:")) sentence = sentence.replace("validationCriteria", "validationCriteria:");
            options.push(validation[words[words.length - 1]].placeholder1);

        }
        else if (Object.keys(validation).includes(words[words.length - 2] + " " + words[words.length - 1])) {
            options.push(validation["complying with"].placeholder1);

        }
        else {
            // options.push.apply(options, Object.keys(condition2));
            // options.push.apply(options, Object.keys(additionalObjectDetails));
            console.log("else")
            //Add to asset in secret variable
            secret.validationCriterion = sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace(secret.additionalObjectDetails, "").replace("by", "").replace(secret.securityMechanism, "").replace("validationCriteria: ", "").trim();
            options.push.apply(options, Object.keys(autoAdaptive));
            console.log(secret);
        }

    }
    /*     else if (!ad && c2 && !aa) {
    
            if (Object.keys(condition2).includes(words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1])) {
                options.push(condition2[words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1);
    
            }
            else {
                options.push.apply(options, Object.keys(additionalObjectDetails));
                options.push.apply(options, Object.keys(autoAdaptive));
            }
    
        } */

    else if (aa) {
        console.log("aa")
        //console.log(elementInSentence(autoAdaptive, sentence));
        if (sentence.includes("additionalDetails:")) sentence = sentence.replace("additionalDetails:", "");
        sentence = sentence.replace("validationCriteria", "validationCriteria:");
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        if ((Object.keys(autoAdaptive).includes(words[words.length - 1])) && (autoAdaptive[words[words.length - 1]].placeholder1 != "")) {
            options.push(autoAdaptive[words[words.length - 1]].placeholder1);

        }
        else if (Object.keys(autoAdaptive).includes(words[words.length - 2] + " " + words[words.length - 1]) && (autoAdaptive[words[words.length - 2] + " " + words[words.length - 1]].placeholder1 != "")) {
            options.push(autoAdaptive[words[words.length - 2] + " " + words[words.length - 1]].placeholder1);

        }
        else if (Object.keys(autoAdaptive).includes(words[words.length - 5] + " " + words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]) && (autoAdaptive[words[words.length - 5] + " " + words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1 != "")) {
            options.push(autoAdaptive[words[words.length - 5] + " " + words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1);

        }
        else if (words[words.length - 1] != "eventually" && (autoAdaptive[elementInSentence((autoAdaptive), sentence)]).placeholder2 != "" &&
            elementInSentence((autoAdaptive), sentence) != words[words.length - 1] &&
            elementInSentence((autoAdaptive), sentence) != words[words.length - 2] + " " + words[words.length - 1] &&
            (elementInSentence((autoAdaptive), sentence) == words[words.length - 2] || elementInSentence((autoAdaptive), sentence) == words[words.length - 3] + " " + words[words.length - 2]))
            options.push(((autoAdaptive)[elementInSentence((autoAdaptive), sentence)]).placeholder2)
        else {
            console.log("aa else")
            console.log(sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace(secret.additionalObjectDetails, "").replace("by", "").replace(secret.securityMechanism, "").replace(secret.validationCriterion, "").trim());
            secret.autoAdaptive = sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace(secret.additionalObjectDetails, "").replace("by", "").replace(secret.securityMechanism, "").replace(secret.validationCriterion, "").trim();
            console.log(secret);
        }

    }
    //if(sentence.includes("additionalDetails:"))sentence = sentence.replace("additionalDetails:", "");

    let data = { "input": sentence, "options": options, "secret": secret };

    return data;


}

function domainRequirementsSuggest(req, domains) {
    console.log(req.input)
    //await domainsList();
    var words = req.input.trim().split(" ");
    var sentence = req.input.trim();
    var domain = req.domain.trim();
    console.log(sentence)
    //var str={"input":sentence, "options":[]};
    var options = [];
    //var c1=words.some(item => Object.keys(conditions1).includes(item));
    var c1 = Object.keys(conditions1).some(element => {
        return sentence.includes(element);
    })
    console.log(c1);
    //var s=words.some(item => Object.keys(system).includes(item));
    var s = Object.keys(systemDomain).some(element => {
        return sentence.includes(element);
    })
    console.log(words);
    console.log(s);
    //var p=words.some(item =>priority.includes(item));
    var p = priority.some(element => {
        return sentence.includes(element);
    })
    //var a1=words.some(item => Object.keys(activity).includes(item));
    var a1 = Object.keys(activity).some(element => {
        return sentence.includes(element);
    })
    console.log(a1);
    //var sc=words.some(item => securityCriteria.includes(item));
    var sc = securityCriteria.some(element => {
        return sentence.includes(element);
    })
    //var a2=words.some(item => Object.keys(asset["of"]).includes(item));
    var a2 = Object.keys(asset["of"]).some(element => {
        return sentence.includes("of " + element);
    })
    var sm = securityMechanism.some(element => {
        return (sentence.includes(element) || (sentence.includes("by") && words[words.length - 1] != "by" && !sentence.includes("<Security Mechanism>")));
    })

    //var sm=false//words.some(item => securityMechanism.includes(item));
    //var vc=words.includes(Object.keys(validation));
    var vc = Object.keys(validation).some(element => {
        return sentence.includes(element);
    })
    //var ad=words.includes(Object.keys(additionalObjectDetails));
    var ad = Object.keys(additionalObjectDetails).some(element => {
        return sentence.includes(element);
    })
    //var c2=words.includes(Object.keys(condition2));
    var c2 = Object.keys(condition2).some(element => {
        return sentence.includes(element);
    })
    //var aa=words.includes(Object.keys(autoAdaptive));
    var aa = Object.keys(autoAdaptive).some(element => {
        return sentence.includes(element);
    })
    var criterion = "";

    // if(words.some(item => activity[elementInSentence(activity,sentence)]["next"].includes(item))) console.log("OK");

    // res.end(JSON.stringify(data.filter(value => value.includes(req.q))));

    // no text yet, show the conditions
    // if(req.q=="")res.end(JSON.stringify(Object.keys(conditions1)));
    // text but no complete condition yet, auto-complete the condition
    //else if(!Object.keys(conditions1).includes(req.q) && req.q!="" && !Object.keys(system).includes(req.q) && !priority.includes(req.q)) res.end(JSON.stringify(Object.keys(conditions1).filter(value => value.includes(req.q))));
    // complete condition, send the values
    //else if(Object.keys(conditions1).includes(req.q))res.end(JSON.stringify(conditions1[req.q]));
    //
    //else if(!Object.keys(system).includes(req.q) && !priority.includes(req.q)) res.end(JSON.stringify(Object.keys(system).filter(value => value.includes(req.q))))
    //
    //else if(Object.keys(system).includes(req.q)) res.end(JSON.stringify(system[req.q]));
    //
    //else if(priority.includes(req.q)) res.end(JSON.stringify(priority.filter(value=> value.includes(req.q))));
    //
    //else if(priority.includes(req.q)) res.end(JSON.stringify(priority.includes(req.q)))
    if (sentence == "") { options.push.apply(options, Object.keys(conditions1)); options.push.apply(options, Object.keys(systemDomain)); console.log(options); secret = {}; }

    else if (!c1 && req.input != "" && !s && !p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {
        if (Object.keys(conditions1).filter(value => value.includes(req.input)).length > 0) options = (Object.keys(conditions1).filter(value => value.includes(req.input)));
        if (Object.keys(systemDomain).filter(value => value.includes(req.input)).length > 0) options = (Object.keys(systemDomain).filter(value => value.includes(req.input)));
        console.log(options)
    }
    else if (c1 && req.input != "" && !s && !p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {

        if (Object.keys(conditions1).includes(words[words.length - 1]))
            options.push((conditions1[words[words.length - 1]]).placeholder);
        else if (words.length >= 2 && Object.keys(conditions1).includes(words[words.length - 2] + " " + words[words.length - 1]))
            options.push((conditions1[words[words.length - 2] + " " + words[words.length - 1]]).placeholder);
        else if (words.length >= 3 && Object.keys(conditions1).includes(words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]))
            options.push((conditions1[words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]]).placeholder);
        else if (conditions1[elementInSentence(conditions1, sentence)]["next"] != "" &&
            (words[words.length - 1]) != conditions1[elementInSentence(conditions1, sentence)]["next"] &&
            (words[words.length - 2] + " " + words[words.length - 1]) != conditions1[elementInSentence(conditions1, sentence)]["next"])
            options.push(conditions1[elementInSentence(conditions1, sentence)]["next"]);
        else options = (Object.keys(systemDomain));
    }
    else if (s && !p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {
        if (Object.keys(systemDomain).includes(words[words.length - 1])) {
            var condition = sentence.replace(words[words.length - 1], "");
            if (condition != "") secret.condition = condition.trim();
            if ((systemDomain[words[words.length - 1]]).placeholder1 != "") {
                options.push((systemDomain[words[words.length - 1]]).placeholder1);
            } else {
                options.push((systemDomain[words[words.length - 1]]).next);
            }
        }
        else if (systemDomain[elementInSentence(systemDomain, sentence)]["next"] == (words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1])) {
            if (systemDomain[elementInSentence(systemDomain, sentence)].placeholder2 != "")
                options.push(systemDomain[elementInSentence(systemDomain, sentence)].placeholder2);
        }
        else if (systemDomain[elementInSentence(systemDomain, sentence)].placeholder3 != "") {
            if (sentence.includes("Restriction: ") && words[words.length - 1] != "Restriction:") {
                options = priority;
            }
            else options.push(systemDomain[elementInSentence(systemDomain, sentence)].placeholder3);
        }

        else {
            options = priority;
        }
    }

    else if (p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {
        if (priority.includes(words[words.length - 1])) {
            if (sentence.includes("Restriction: ")) {
                let str = sentence.replace("Restriction: ", "");
                sentence = str.trim();
            }
            var sys = sentence.replace(words[words.length - 1], "");
            if (secret.condition) sys = sys.replace(secret.condition, "").trim();
            secret.system = sys;
            secret.priority = words[words.length - 1];
            options = (Object.keys(activity));
        }
        //verb replaced
        /* else if (priority.includes(words[words.length - 2])) {
            if(domains.includes(domain)) await getDomainCriteria(domain)
            else await getAllCriteria();
            options = (securityCriteria);
        } */
    }
    else if (a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {
        if (Object.keys(activity).includes(words[words.length - 1])) {
            if (words[words.length - 1] == "verb") sentence = sentence.replace("verb", "verb: ");
            options.push((activity[words[words.length - 1]]).placeholder1);
        }
        else if (words.length >= 3 && Object.keys(activity).includes(words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1])) {
            options.push((activity[words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]]).placeholder1);
        }
        else if (!sentence.includes("verb:") && activity[elementInSentence(activity, sentence)]["next"] != "" &&
            (!Array.isArray(activity[elementInSentence(activity, sentence)]["next"]) &&
                !sentence.includes(activity[elementInSentence(activity, sentence)]["next"]) &&
                (words[words.length - 1]) != activity[elementInSentence(activity, sentence)]["next"] &&
                (words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]) != activity[elementInSentence(activity, sentence)]["next"] &&
                !activity[elementInSentence(activity, sentence)]["next"].includes((words[words.length - 1])) ||
                (Array.isArray(activity[elementInSentence(activity, sentence)]["next"]) && !words.some(item => activity[elementInSentence(activity, sentence)]["next"].includes(item)))))
            if (Array.isArray(activity[elementInSentence(activity, sentence)]["next"]))
                options.push.apply(options, activity[elementInSentence(activity, sentence)]["next"]);
            else options.push(activity[elementInSentence(activity, sentence)]["next"])
        else if (!sentence.includes("verb:") && activity[elementInSentence(activity, sentence)]["next"] != "" &&
            (activity[elementInSentence(activity, sentence)]).placeholder2 != "" &&
            ((words[words.length - 1]) == activity[elementInSentence(activity, sentence)]["next"] ||
                (words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]) == activity[elementInSentence(activity, sentence)]["next"] ||
                activity[elementInSentence(activity, sentence)]["next"].includes((words[words.length - 1]))))
            options.push((activity[elementInSentence(activity, sentence)]).placeholder2)
        else {
            console.log(securityCriteria)
            //Needs to be synchronized
            //if(domains.includes(domain)) 
            //await getDomainCriteria(domain)
            //else 
            //await getAllCriteria();
            options = (securityCriteria);

        }
    }
    else if (sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {

        if (securityCriteria.includes(words[words.length - 1])) {
            //Add to activity in secret variable
            secret.activity = (sentence.split(secret.priority)[1]).replace(words[words.length - 1], "").trim();
            criterion = words[words.length - 1];
            //Add to criterion in secret variable
            secret.securityCriteria = criterion;
            console.log(criterion)
            sentence += " of ";
            options = (Object.keys(asset["of"]));

        }
    }
    else if (a2 && !sm && !vc && !ad && !c2 && !aa) {
        //console.log(sentence.split("of")[1])
        //console.log(((asset["of"])[elementInSentence((asset["of"]),sentence.split("of")[1])]));
        sentence = sentence.replace("verb: ", "");
        if (Object.keys(asset["of"]).includes(words[words.length - 1])) {
            options.push(((asset["of"])[words[words.length - 1]]).placeholder1);
            console.log(options);
        }
        else if (Object.keys(asset["of"]).includes(words[words.length - 2] + " " + words[words.length - 1])) {
            options.push(((asset["of"])[words[words.length - 2] + " " + words[words.length - 1]]).placeholder1);
        }
        else if ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] != "" &&
            !sentence.includes((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"]) &&
            (words[words.length - 1]) != (asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] &&
            (words[words.length - 2] + " " + words[words.length - 1]) != (asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] &&
            !(asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"].includes((words[words.length - 1])))
            options.push((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"])
        else if ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] != "" &&
            ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]).placeholder2 != "" &&
            ((words[words.length - 1]) == (asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] ||
                (words[words.length - 2] + " " + words[words.length - 1]) == (asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] ||
                (asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"].includes((words[words.length - 1]))))
            options.push(((asset["of"])[ObjectInSentence((asset["of"]), sentence)]).placeholder2)
        else if ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] == "" &&
            ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]).placeholder2 != "" &&
            (ObjectInSentence((asset["of"]), sentence)) == (words[words.length - 2]))
            options.push(((asset["of"])[ObjectInSentence((asset["of"]), sentence)]).placeholder2)
        else if ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] != "" &&
            ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]).placeholder3 != "" &&
            ((words[words.length - 1]) != (asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] &&
                (words[words.length - 2] + " " + words[words.length - 1]) != (asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] &&
                (sentence.includes((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"]))) &&
            ((asset["of"])[ObjectInSentence((asset["of"]), sentence)]["next"] == (words[words.length - 2])))
            options.push(((asset["of"])[ObjectInSentence((asset["of"]), sentence)]).placeholder3)
        else if (sentence.includes("by <Security Mechanism>")) {
            sentence = sentence.replace("by <Security Mechanism>", "");
            sentence += "by ";
            criterion = securityCriteria.find(element => words.includes(element));
            console.log(criterion);
            if (criterion != "") {
                //if(domains.includes(domain)) 
                //    await getDomainCriteriaMechanisms(criterion,domain)
                //else 
                //    await getCriteriaMechanisms(criterion);
            }
            options.push.apply(options, securityMechanism);
        }
        else {
            console.log("else")
            //Add to asset in secret variable
            secret.asset = sentence.split(secret.securityCriteria)[1].replace("of", "").trim();
            //Needs to be synchronized

            //sentence += " by ";
            options.push.apply(options, Object.keys(condition2));
            options.push.apply(options, Object.keys(additionalObjectDetails));
            options.push("by <Security Mechanism>");
            options.push.apply(options, Object.keys(validation));
            options.push.apply(options, Object.keys(autoAdaptive));
            console.log(options)
        }
        //if(elementInSentence((asset["of"]),sentence)=="Number") sentence=sentence.replace("","");
    }

    else if (!ad && c2 && !aa && !sm && !vc) {
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        if (Object.keys(condition2).includes(words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1])) {
            options.push(condition2[words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1);

        }
        else if (sentence.includes("by <Security Mechanism>")) {
            sentence = sentence.replace("by <Security Mechanism>", "");
            sentence += "by ";
            criterion = securityCriteria.find(element => words.includes(element));
            console.log(criterion);
            if (criterion != "") {
                //if(domains.includes(domain))  
                //    await getDomainCriteriaMechanisms(criterion,domain)
                //else 
                //    await getCriteriaMechanisms(criterion);
            }
            options.push.apply(options, securityMechanism);
        }
        else {
            //Add to securityMechanism in secret variable

            options.push.apply(options, Object.keys(additionalObjectDetails));
            options.push("by <Security Mechanism>");
            options.push.apply(options, Object.keys(validation));
            options.push.apply(options, Object.keys(autoAdaptive));

            //console.log(sentence.split(secret.asset.trim()));
            secret.conditionalityObject = sentence.split(secret.asset)[1].trim();
            console.log(secret);
        }

    }
    else if (ad && !aa && !sm && !vc) {
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        if (Object.keys(additionalObjectDetails).includes(words[words.length - 1])) {
            if (!sentence.includes("additionalDetails:")) sentence = sentence.replace("additionalDetails", "additionalDetails:");
            options.push(additionalObjectDetails[words[words.length - 1]].placeholder1);

        }
        else if (sentence.includes("by <Security Mechanism>")) {
            sentence = sentence.replace("by <Security Mechanism>", "");
            sentence += "by ";
            criterion = securityCriteria.find(element => words.includes(element));
            console.log(criterion);
            if (criterion != "") {
                //if(domains.includes(domain)) 
                //    await getDomainCriteriaMechanisms(criterion,domain)
                //else 
                //    await getCriteriaMechanisms(criterion);
            }
            options.push.apply(options, securityMechanism);
            //sentence = sentence.replace("additionalDetails:", "");
        }
        else {
            //ad=true;
            //sentence = sentence.replace("additionalDetails:", "");
            secret.additionalObjectDetails = sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace("additionalDetails:", "").trim();
            options.push("by <Security Mechanism>");
            options.push.apply(options, Object.keys(validation));
            options.push.apply(options, Object.keys(autoAdaptive));
            options.push.apply(Object.keys(autoAdaptive));
            console.log(secret);
        }

    }

    else if (sm && !vc && !aa) {
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        //Add to securityMechanism in secret variable
        sentence = sentence.replace("additionalDetails:", "");
        secret.securityMechanism = sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace(secret.additionalObjectDetails, "").replace("by", "").trim();
        console.log(secret);
        //console.log(asset["of"])
        //if (securityMechanism.includes(words[words.length - 1])) {
        options.push.apply(options, Object.keys(validation));
        //options.push.apply(options, Object.keys(condition2));
        //options.push.apply(options, Object.keys(additionalObjectDetails));
        options.push.apply(options, Object.keys(autoAdaptive));
        console.log(options)

        //}

    }
    else if (vc && !aa) {
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        sentence = sentence.replace("additionalDetails:", "");
        if (Object.keys(validation).includes(words[words.length - 1])) {
            if (!sentence.includes("validationCriteria:")) sentence = sentence.replace("validationCriteria", "validationCriteria:");
            options.push(validation[words[words.length - 1]].placeholder1);

        }
        else if (Object.keys(validation).includes(words[words.length - 2] + " " + words[words.length - 1])) {
            options.push(validation["complying with"].placeholder1);

        }
        else {
            // options.push.apply(options, Object.keys(condition2));
            // options.push.apply(options, Object.keys(additionalObjectDetails));
            console.log("else")
            //Add to asset in secret variable
            secret.validationCriterion = sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace(secret.additionalObjectDetails, "").replace("by", "").replace(secret.securityMechanism, "").replace("validationCriteria: ", "").trim();
            options.push.apply(options, Object.keys(autoAdaptive));
            console.log(secret);
        }

    }
    /*     else if (!ad && c2 && !aa) {
    
            if (Object.keys(condition2).includes(words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1])) {
                options.push(condition2[words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1);
    
            }
            else {
                options.push.apply(options, Object.keys(additionalObjectDetails));
                options.push.apply(options, Object.keys(autoAdaptive));
            }
    
        } */

    else if (aa) {
        console.log("aa")
        //console.log(elementInSentence(autoAdaptive, sentence));
        if (sentence.includes("additionalDetails:")) sentence = sentence.replace("additionalDetails:", "");
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        sentence = sentence.replace("validationCriteria", "validationCriteria:");
        if ((Object.keys(autoAdaptive).includes(words[words.length - 1])) && (autoAdaptive[words[words.length - 1]].placeholder1 != "")) {
            options.push(autoAdaptive[words[words.length - 1]].placeholder1);

        }
        else if (Object.keys(autoAdaptive).includes(words[words.length - 2] + " " + words[words.length - 1]) && (autoAdaptive[words[words.length - 2] + " " + words[words.length - 1]].placeholder1 != "")) {
            options.push(autoAdaptive[words[words.length - 2] + " " + words[words.length - 1]].placeholder1);

        }
        else if (Object.keys(autoAdaptive).includes(words[words.length - 5] + " " + words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]) && (autoAdaptive[words[words.length - 5] + " " + words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1 != "")) {
            options.push(autoAdaptive[words[words.length - 5] + " " + words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1);

        }
        else if (words[words.length - 1] != "eventually" && (autoAdaptive[elementInSentence((autoAdaptive), sentence)]).placeholder2 != "" &&
            elementInSentence((autoAdaptive), sentence) != words[words.length - 1] &&
            elementInSentence((autoAdaptive), sentence) != words[words.length - 2] + " " + words[words.length - 1] &&
            (elementInSentence((autoAdaptive), sentence) == words[words.length - 2] || elementInSentence((autoAdaptive), sentence) == words[words.length - 3] + " " + words[words.length - 2]))
            options.push(((autoAdaptive)[elementInSentence((autoAdaptive), sentence)]).placeholder2)
        else {
            console.log("aa else")
            console.log(sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace(secret.additionalObjectDetails, "").replace("by", "").replace(secret.securityMechanism, "").replace(secret.validationCriterion, "").trim());
            secret.autoAdaptive = sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace(secret.additionalObjectDetails, "").replace("by", "").replace(secret.securityMechanism, "").replace(secret.validationCriterion, "").trim();
            console.log(secret);
        }

    }

    //if(sentence.includes("additionalDetails:"))sentence = sentence.replace("additionalDetails:", "");
    let data = { "input": sentence, "options": options, "secret": secret };


    return data;
}

function domainFunctionalRequirementsSuggest(req) {

    console.log(req.input)
    //res.setHeader('Content-Type', 'application/json');

    var words = req.input.trim().split(" ");
    var sentence = req.input.trim();
    console.log(sentence)
    //var str={"input":sentence, "options":[]};
    var options = [];
    //var c1=words.some(item => Object.keys(conditions1).includes(item));
    var c1 = Object.keys(conditions1).some(element => {
        return sentence.includes(element);
    })
    console.log(c1);
    //var s=words.some(item => Object.keys(system).includes(item));
    var s = Object.keys(systemDomain).some(element => {
        return sentence.includes(element);
    })
    console.log(words);
    console.log(s);
    //var p=words.some(item =>priority.includes(item));
    var p = priority.some(element => {
        return sentence.includes(element);
    })
    //var a1=words.some(item => Object.keys(activity).includes(item));
    var a1 = Object.keys(activity).some(element => {
        return sentence.includes(element);
    })
    console.log(a1);
    //var sc=words.some(item => securityCriteria.includes(item));
    var sc = securityCriteria.some(element => {
        return sentence.includes(element);
    })
    //var a2=words.some(item => Object.keys(asset["of"]).includes(item));
    var a2 = Object.keys(asset["of"]).some(element => {
        var pr = "";
        priority.some(e => { if (sentence.includes(e)) pr = e; })
        console.log()
        if (p) return (sentence.includes(element, sentence.indexOf(pr)));
        else return false;
    })
    console.log(a2 + " A2")
    var sm = securityMechanism.some(element => {
        return sentence.includes(element);
    })

    //var sm=false//words.some(item => securityMechanism.includes(item));
    //var vc=words.includes(Object.keys(validation));
    var vc = Object.keys(validation).some(element => {
        return sentence.includes(element);
    })
    //var ad=words.includes(Object.keys(additionalObjectDetails));
    var ad = Object.keys(additionalObjectDetails).some(element => {
        return sentence.includes(element);
    })
    //var c2=words.includes(Object.keys(condition2));
    var c2 = Object.keys(condition2).some(element => {
        return sentence.includes(element);
    })
    //var aa=words.includes(Object.keys(autoAdaptive));
    var aa = Object.keys(autoAdaptive).some(element => {
        return sentence.includes(element);
    })
    var criterion = "";

    // if(words.some(item => activity[elementInSentence(activity,sentence)]["next"].includes(item))) console.log("OK");

    // res.end(JSON.stringify(data.filter(value => value.includes(req.q))));

    // no text yet, show the conditions
    // if(req.q=="")res.end(JSON.stringify(Object.keys(conditions1)));
    // text but no complete condition yet, auto-complete the condition
    //else if(!Object.keys(conditions1).includes(req.q) && req.q!="" && !Object.keys(system).includes(req.q) && !priority.includes(req.q)) res.end(JSON.stringify(Object.keys(conditions1).filter(value => value.includes(req.q))));
    // complete condition, send the values
    //else if(Object.keys(conditions1).includes(req.q))res.end(JSON.stringify(conditions1[req.q]));
    //
    //else if(!Object.keys(system).includes(req.q) && !priority.includes(req.q)) res.end(JSON.stringify(Object.keys(system).filter(value => value.includes(req.q))))
    //
    //else if(Object.keys(system).includes(req.q)) res.end(JSON.stringify(system[req.q]));
    //
    //else if(priority.includes(req.q)) res.end(JSON.stringify(priority.filter(value=> value.includes(req.q))));
    //
    //else if(priority.includes(req.q)) res.end(JSON.stringify(priority.includes(req.q)))
    if (sentence == "") { options.push.apply(options, Object.keys(conditions1)); options.push.apply(options, Object.keys(systemDomain)); console.log(options); secret = {}; }

    else if (!c1 && req.input != "" && !s && !p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {
        if (Object.keys(conditions1).filter(value => value.includes(req.input)).length > 0) options = (Object.keys(conditions1).filter(value => value.includes(req.input)));
        if (Object.keys(systemDomain).filter(value => value.includes(req.input)).length > 0) options = (Object.keys(systemDomain).filter(value => value.includes(req.input)));
        console.log(options)
    }
    else if (c1 && req.input != "" && !s && !p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {

        if (Object.keys(conditions1).includes(words[words.length - 1]))
            options.push((conditions1[words[words.length - 1]]).placeholder);
        else if (words.length >= 2 && Object.keys(conditions1).includes(words[words.length - 2] + " " + words[words.length - 1]))
            options.push((conditions1[words[words.length - 2] + " " + words[words.length - 1]]).placeholder);
        else if (words.length >= 3 && Object.keys(conditions1).includes(words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]))
            options.push((conditions1[words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]]).placeholder);
        else if (conditions1[elementInSentence(conditions1, sentence)]["next"] != "" &&
            (words[words.length - 1]) != conditions1[elementInSentence(conditions1, sentence)]["next"] &&
            (words[words.length - 2] + " " + words[words.length - 1]) != conditions1[elementInSentence(conditions1, sentence)]["next"])
            options.push(conditions1[elementInSentence(conditions1, sentence)]["next"]);
        else options = (Object.keys(systemDomain));
    }
    else if (s && !p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {
        if (Object.keys(systemDomain).includes(words[words.length - 1])) {
            var condition = sentence.replace(words[words.length - 1], "");
            if (condition != "") secret.condition = condition.trim();
            if ((systemDomain[words[words.length - 1]]).placeholder1 != "") {
                options.push((systemDomain[words[words.length - 1]]).placeholder1);
            } else {
                options.push((systemDomain[words[words.length - 1]]).next);
            }
        }
        else if (systemDomain[elementInSentence(systemDomain, sentence)]["next"] == (words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1])) {
            if (systemDomain[elementInSentence(systemDomain, sentence)].placeholder2 != "")
                options.push(systemDomain[elementInSentence(systemDomain, sentence)].placeholder2);
        }
        else if (systemDomain[elementInSentence(systemDomain, sentence)].placeholder3 != "") {
            if (sentence.includes("Restriction: ") && words[words.length - 1] != "Restriction:") {
                options = priority;
            }
            else options.push(systemDomain[elementInSentence(systemDomain, sentence)].placeholder3);
        }

        else {
            options = priority;
        }
    }
    else if (p && !a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {
        if (priority.includes(words[words.length - 1])) {
            if (sentence.includes("Restriction: ")) {
                let str = sentence.replace("Restriction: ", "");
                sentence = str.trim();
            }
            var sys = sentence.replace(words[words.length - 1], "");
            if (secret.condition) sys = sys.replace(secret.condition, "").trim();
            secret.system = sys;
            secret.priority = words[words.length - 1];
            options = (Object.keys(activity));
        }
        //verb replaced
        /* else if (priority.includes(words[words.length - 2])) {
           // await getAllCriteria();
           // options = (securityCriteria);
           options = (Object.keys(asset["of"]));
        } */
    }
    else if (a1 && !sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {

        if (Object.keys(activity).includes(words[words.length - 1])) {
            if (words[words.length - 1] == "verb") sentence = sentence.replace("verb", "verb: ");
            if ((words[words.length - 1]) == "provide") options = (Object.keys(asset["of"]))
            console.log(options)
            options.push((activity[words[words.length - 1]]).placeholder1);


        }

        else if (words.length >= 3 && Object.keys(activity).includes(words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1])) {
            options.push((activity[words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]]).placeholder1);
        }
        else if (!sentence.includes("verb:") && activity[elementInSentence(activity, sentence)]["next"] != "" &&
            (!Array.isArray(activity[elementInSentence(activity, sentence)]["next"]) &&
                !sentence.includes(activity[elementInSentence(activity, sentence)]["next"]) &&
                (words[words.length - 1]) != activity[elementInSentence(activity, sentence)]["next"] &&
                (words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]) != activity[elementInSentence(activity, sentence)]["next"] &&
                !activity[elementInSentence(activity, sentence)]["next"].includes((words[words.length - 1])) ||
                (Array.isArray(activity[elementInSentence(activity, sentence)]["next"]) && !words.some(item => activity[elementInSentence(activity, sentence)]["next"].includes(item)))))
            if (Array.isArray(activity[elementInSentence(activity, sentence)]["next"]))
                options.push.apply(options, activity[elementInSentence(activity, sentence)]["next"]);
            else options.push(activity[elementInSentence(activity, sentence)]["next"])
        else if (!sentence.includes("verb:") && activity[elementInSentence(activity, sentence)]["next"] != "" &&
            (activity[elementInSentence(activity, sentence)]).placeholder2 != "" &&
            ((words[words.length - 1]) == activity[elementInSentence(activity, sentence)]["next"] ||
                (words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]) == activity[elementInSentence(activity, sentence)]["next"] ||
                activity[elementInSentence(activity, sentence)]["next"].includes((words[words.length - 1]))))
            options.push((activity[elementInSentence(activity, sentence)]).placeholder2)

        else {

            //console.log(securityCriteria)
            //Needs to be synchronized
            //await getAllCriteria();
            //options = (securityCriteria);
            options = (Object.keys(asset["of"]));

        }
    }
    // else if (sc && !a2 && !sm && !vc && !ad && !c2 && !aa) {

    //     if (securityCriteria.includes(words[words.length - 1])) {
    //         criterion = words[words.length - 1];
    //         console.log(criterion)
    //         sentence += " of ";


    //     }
    // }
    else if (a2 && !sm && !vc && !ad && !c2 && !aa) {
        //console.log(sentence.split("of")[1])
        sentence = sentence.replace("verb: ", "");
        console.log(((asset["of"])[elementInSentence((asset["of"]), sentence)]));
        if (Object.keys(asset["of"]).includes(words[words.length - 1])) {
            secret.activity = (sentence.split(secret.priority)[1]).replace(words[words.length - 1], "").trim();
            options.push(((asset["of"])[words[words.length - 1]]).placeholder1);
            console.log(options);
        }
        else if (Object.keys(asset["of"]).includes(words[words.length - 2] + " " + words[words.length - 1])) {
            secret.activity = (sentence.split(secret.priority)[1]).replace(words[words.length - 2] + " " + words[words.length - 1], "").trim();
            options.push(((asset["of"])[words[words.length - 2] + " " + words[words.length - 1]]).placeholder1);
        }
        else if ((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] != "" &&
            !sentence.includes((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"]) &&
            (words[words.length - 1]) != (asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] &&
            (words[words.length - 2] + " " + words[words.length - 1]) != (asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] &&
            !(asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"].includes((words[words.length - 1])))
            options.push((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"])
        else if ((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] != "" &&
            ((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]).placeholder2 != "" &&
            ((words[words.length - 1]) == (asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] ||
                (words[words.length - 2] + " " + words[words.length - 1]) == (asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] ||
                (asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"].includes((words[words.length - 1]))))
            options.push(((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]).placeholder2)
        else if ((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] == "" &&
            ((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]).placeholder2 != "" &&
            (elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])) == (words[words.length - 2]))
            options.push(((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]).placeholder2)
        else if ((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"] != "" &&
            ((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]).placeholder3 != "" &&
            ((words[words.length - 1]) != (asset["of"])[elementInSentence((asset["of"]), sentence)]["next"] &&
                (words[words.length - 2] + " " + words[words.length - 1]) != (asset["of"])[elementInSentence((asset["of"]), sentence)]["next"] &&
                (sentence.includes((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]["next"]))) &&
            ((asset["of"])[elementInSentence((asset["of"]), sentence)]["next"] == (words[words.length - 2])))
            options.push(((asset["of"])[elementInSentence((asset["of"]), (sentence.split(secret.priority))[1])]).placeholder3)
        else {
            console.log("else")
            //Add to asset in secret variable
            secret.asset = sentence.split(secret.activity)[1].trim();
            //Needs to be synchronized
            //criterion = securityCriteria.find(element => words.includes(element));
            //console.log(criterion);
            //if (criterion != "") await getCriteriaMechanisms(criterion);
            //sentence += " by ";
            //options = (securityMechanism);
            options.push.apply(options, Object.keys(condition2));
            options.push.apply(options, Object.keys(additionalObjectDetails));
            options.push.apply(options, Object.keys(validation));
            options.push.apply(options, Object.keys(autoAdaptive));

        }
        //if(elementInSentence((asset["of"]),sentence)=="Number") sentence=sentence.replace("","");
    }
    // else if (sm && !vc && !ad && !c2 && !aa) {

    //     //console.log(asset["of"])
    //     if (securityMechanism.includes(words[words.length - 1])) {
    //         options.push.apply(options, Object.keys(validation));
    //         options.push.apply(options, Object.keys(condition2));
    //         options.push.apply(options, Object.keys(additionalObjectDetails));
    //         options.push.apply(options, Object.keys(autoAdaptive));
    //         console.log(options)

    //     }

    // }
    else if (!ad && c2 && !aa && !sm && !vc) {
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        if (Object.keys(condition2).includes(words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1])) {
            options.push(condition2[words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1);
        }
        else {
            //Add to securityMechanism in secret variable

            options.push.apply(options, Object.keys(additionalObjectDetails));
            options.push.apply(options, Object.keys(validation));
            options.push.apply(options, Object.keys(autoAdaptive));

            //console.log(sentence.split(secret.asset.trim()));
            secret.conditionalityObject = sentence.split(secret.asset)[1].trim();
            console.log(secret);
        }

    }
    else if (ad && !aa && !sm && !vc) {
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        if (Object.keys(additionalObjectDetails).includes(words[words.length - 1])) {
            if (!sentence.includes("additionalDetails:")) sentence = sentence.replace("additionalDetails", "additionalDetails:");
            options.push(additionalObjectDetails[words[words.length - 1]].placeholder1);

        }
        else {
            //ad=true;
            //sentence = sentence.replace("additionalDetails:", "");
            secret.additionalObjectDetails = sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace("additionalDetails:", "").trim();
            options.push.apply(options, Object.keys(validation));
            options.push.apply(options, Object.keys(autoAdaptive));
            options.push.apply(Object.keys(autoAdaptive));
            console.log(secret);
        }

    }

    else if (vc && !aa) {
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        sentence = sentence.replace("additionalDetails:", "");
        if (Object.keys(validation).includes(words[words.length - 1])) {
            if (!sentence.includes("validationCriteria:")) sentence = sentence.replace("validationCriteria", "validationCriteria:");
            options.push(validation[words[words.length - 1]].placeholder1);

        }
        else if (Object.keys(validation).includes(words[words.length - 2] + " " + words[words.length - 1])) {
            options.push(validation["complying with"].placeholder1);

        }
        else {
            // options.push.apply(options, Object.keys(condition2));
            // options.push.apply(options, Object.keys(additionalObjectDetails));
            console.log("else")
            //Add to asset in secret variable
            secret.validationCriterion = sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace(secret.additionalObjectDetails, "").replace("by", "").replace(secret.securityMechanism, "").replace("validationCriteria: ", "").trim();
            options.push.apply(options, Object.keys(autoAdaptive));
            console.log(secret);
        }

    }
    /*     else if (!ad && c2 && !aa) {
    
            if (Object.keys(condition2).includes(words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1])) {
                options.push(condition2[words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1);
    
            }
            else {
                options.push.apply(options, Object.keys(additionalObjectDetails));
                options.push.apply(options, Object.keys(autoAdaptive));
            }
    
        } */

    else if (aa) {
        console.log("aa")
        //console.log(elementInSentence(autoAdaptive, sentence));
        if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
        if (sentence.includes("additionalDetails:")) sentence = sentence.replace("additionalDetails:", "");
        sentence = sentence.replace("validationCriteria", "validationCriteria:");
        if ((Object.keys(autoAdaptive).includes(words[words.length - 1])) && (autoAdaptive[words[words.length - 1]].placeholder1 != "")) {
            options.push(autoAdaptive[words[words.length - 1]].placeholder1);

        }
        else if (Object.keys(autoAdaptive).includes(words[words.length - 2] + " " + words[words.length - 1]) && (autoAdaptive[words[words.length - 2] + " " + words[words.length - 1]].placeholder1 != "")) {
            options.push(autoAdaptive[words[words.length - 2] + " " + words[words.length - 1]].placeholder1);

        }
        else if (Object.keys(autoAdaptive).includes(words[words.length - 5] + " " + words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]) && (autoAdaptive[words[words.length - 5] + " " + words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1 != "")) {
            options.push(autoAdaptive[words[words.length - 5] + " " + words[words.length - 4] + " " + words[words.length - 3] + " " + words[words.length - 2] + " " + words[words.length - 1]].placeholder1);

        }
        else if (words[words.length - 1] != "eventually" && (autoAdaptive[elementInSentence((autoAdaptive), sentence)]).placeholder2 != "" &&
            elementInSentence((autoAdaptive), sentence) != words[words.length - 1] &&
            elementInSentence((autoAdaptive), sentence) != words[words.length - 2] + " " + words[words.length - 1] &&
            (elementInSentence((autoAdaptive), sentence) == words[words.length - 2] || elementInSentence((autoAdaptive), sentence) == words[words.length - 3] + " " + words[words.length - 2]))
            options.push(((autoAdaptive)[elementInSentence((autoAdaptive), sentence)]).placeholder2)
        else {
            console.log("aa else")
            console.log(sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace(secret.additionalObjectDetails, "").replace("by", "").replace(secret.securityMechanism, "").replace(secret.validationCriterion, "").trim());
            secret.autoAdaptive = sentence.split(secret.asset)[1].replace(secret.conditionalityObject, "").replace(secret.additionalObjectDetails, "").replace("by", "").replace(secret.securityMechanism, "").replace(secret.validationCriterion, "").trim();
            console.log(secret);
        }

    }
    //if(sentence.includes("additionalDetails:"))sentence = sentence.replace("additionalDetails:", "");

    let data = { "input": sentence, "options": options, "secret": secret };


    return data;
}

async function endRequirement(req) {
    console.log(req.input)
    //await domainsList();
    //var words = req.input.trim().split(" ");
    var sentence = req.input.trim();
    if (sentence.includes("Number:")) sentence = sentence.replace(" Number:", "");
    if (sentence.includes("additionalDetails:")) sentence = sentence.replace("additionalDetails: ", "");
    if (sentence.includes("validationCriteria:")) sentence = sentence.replace("validationCriteria: ", "");
    let data = { "input": sentence[0].toUpperCase() + sentence.slice(1).toLowerCase() };


    return data;
}

async function getAllDomainsList() {  
   try { 
       let res = await axios.get(ip + 'domain');
       let domains = res.data;
       return domains; 
   }
   catch (e) {
       console.log(e)
   } 
}

export {  securityRequirementsSuggest, domainRequirementsSuggest, functionalRequirementsSuggest, domainFunctionalRequirementsSuggest, endRequirement, getAllDomainsList };