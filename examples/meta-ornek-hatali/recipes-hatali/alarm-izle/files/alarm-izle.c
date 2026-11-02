// SPDX-License-Identifier: MIT
// alarm-izle: verilen sıcaklık eşik değeri aşılırsa alarm üretir (benzetim)
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[])
{
    double esik = (argc > 1) ? atof(argv[1]) : 30.0;
    double olcum = 21.4;

    if (olcum > esik) {
        printf("ALARM: %.1f C > %.1f C\n", olcum, esik);
        return 2;
    }
    printf("Normal: %.1f C <= %.1f C\n", olcum, esik);
    return 0;
}
