using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Menu : MonoBehaviour
{
    public UnityEngine.UI.Dropdown dropdown;

    GameObject currentChr = null;
    bool requestFit = false;

    void Start()
    {
        var options = dropdown.options;
        Shot.EachChrObject((go, name) => {
            options.Add(new UnityEngine.UI.Dropdown.OptionData(name));
        }, true);
    }

    void Update()
    {
        if (requestFit)
        {
            requestFit = false;
            GameObject tmp;
            string name;
            Camera.main.GetComponent<Shot>().FitCameraArea(out tmp, out name);
        }
    }

    public void OnChrChanged()
    {
        var current = dropdown.options[dropdown.value].text;
        Shot.EachChrObject((go, name) =>
        {
            if (name == current)
            {
                go.SetActive(true);
                currentChr = go;
                requestFit = true;
            }
            else
            {
                go.SetActive(false);
            }
        }, true);
    }
}
